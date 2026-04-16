import * as fs from 'fs';
import * as path from 'path';

export enum ZoneType {
  WORKSPACE = 'workspace',
  SANDBOX = 'sandbox',
  DEVELOPMENT = 'development',
  SYSTEM = 'system',
  PERSONAL = 'personal',
  CONFIG = 'config',
}

export enum ModificationDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  SANDBOX_REDIRECT = 'sandbox_redirect',
}

export interface GuardianConfig {
  workspacePath: string;
  sandboxPath: string;
  enabled: boolean;
}

export interface FileInfo {
  path: string;
  zone: ZoneType;
  canModify: boolean;
  reason?: string;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  details?: string;
}

const CRITICAL_SYSTEM_PATHS = [
  '/bin', '/sbin', '/usr/bin', '/usr/sbin',
  '/lib', '/lib64', '/usr/lib', '/usr/lib64',
  '/etc', '/var', '/proc', '/sys', '/dev',
];

const DEV_DIRECTORIES = [
  'Projects', 'projects', 'code', 'Code', 'dev', 'Dev',
  'workspace', 'Workspace', 'repos', 'Repos',
];

export class GuardianTestModule {
  private config: GuardianConfig;
  private auditLog: any[] = [];

  constructor(config: Partial<GuardianConfig> = {}) {
    this.config = {
      workspacePath: config.workspacePath || process.cwd(),
      sandboxPath: config.sandboxPath || '/tmp/guardian-test-sandbox',
      enabled: config.enabled !== undefined ? config.enabled : true,
    };
  }

  classifyPath(filePath: string): { zone: ZoneType; reason: string } {
    const absolutePath = path.resolve(filePath);
    const normalizedPath = absolutePath.toLowerCase();
    const workspaceNormalized = path.normalize(this.config.workspacePath).toLowerCase();
    const sandboxNormalized = path.normalize(this.config.sandboxPath).toLowerCase();

    if (normalizedPath.startsWith(workspaceNormalized)) {
      return { zone: ZoneType.WORKSPACE, reason: 'Within designated workspace' };
    }

    if (normalizedPath.startsWith(sandboxNormalized)) {
      return { zone: ZoneType.SANDBOX, reason: 'Within sandbox environment' };
    }

    for (const sysPath of CRITICAL_SYSTEM_PATHS) {
      if (normalizedPath.startsWith(sysPath.toLowerCase())) {
        return { zone: ZoneType.SYSTEM, reason: `Critical system path: ${sysPath}` };
      }
    }

    const homeDir = process.env.HOME || '';
    if (normalizedPath.startsWith(homeDir.toLowerCase())) {
      const relativePath = normalizedPath.slice(homeDir.length);
      for (const devPath of DEV_DIRECTORIES) {
        if (relativePath.includes(devPath.toLowerCase())) {
          return { zone: ZoneType.DEVELOPMENT, reason: `Development directory: ${devPath}` };
        }
      }
    }

    const basename = path.basename(normalizedPath);
    if (['.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config'].some(ext => basename.endsWith(ext))) {
      if (normalizedPath.includes('/etc/')) {
        return { zone: ZoneType.CONFIG, reason: 'System configuration file' };
      }
    }

    return { zone: ZoneType.PERSONAL, reason: 'Outside workspace - requires permission' };
  }

  checkPermission(filePath: string, operation: 'read' | 'write' | 'delete' = 'write'): ModificationDecision {
    if (!this.config.enabled) {
      return ModificationDecision.ALLOW;
    }

    const { zone } = this.classifyPath(filePath);

    if (zone === ZoneType.SYSTEM) {
      this.logAudit({ operation, path: filePath, decision: ModificationDecision.DENY, reason: 'System zone blocked' });
      return ModificationDecision.DENY;
    }

    if (zone === ZoneType.PERSONAL && operation !== 'read') {
      this.logAudit({ operation, path: filePath, decision: ModificationDecision.DENY, reason: 'Personal zone blocked' });
      return ModificationDecision.DENY;
    }

    if (zone === ZoneType.CONFIG && operation !== 'read') {
      this.logAudit({ operation, path: filePath, decision: ModificationDecision.DENY, reason: 'Config zone blocked' });
      return ModificationDecision.DENY;
    }

    if (zone === ZoneType.WORKSPACE || zone === ZoneType.SANDBOX || zone === ZoneType.DEVELOPMENT) {
      this.logAudit({ operation, path: filePath, decision: ModificationDecision.ALLOW, reason: 'Allowed zone' });
      return ModificationDecision.ALLOW;
    }

    return ModificationDecision.DENY;
  }

  async safeWrite(filePath: string, content: string): Promise<{ success: boolean; actualPath: string; reason?: string }> {
    const decision = this.checkPermission(filePath, 'write');
    const absolutePath = path.resolve(filePath);

    if (decision === ModificationDecision.ALLOW) {
      fs.writeFileSync(absolutePath, content);
      return { success: true, actualPath: absolutePath };
    }

    if (decision === ModificationDecision.SANDBOX_REDIRECT) {
      const sandboxPath = path.join(this.config.sandboxPath, path.basename(filePath));
      fs.writeFileSync(sandboxPath, content);
      return { success: true, actualPath: sandboxPath, reason: 'Written to sandbox' };
    }

    return { success: false, actualPath: absolutePath, reason: 'Operation denied' };
  }

  async safeRead(filePath: string): Promise<{ success: boolean; content?: string; reason?: string }> {
    const decision = this.checkPermission(filePath, 'read');

    if (decision === ModificationDecision.DENY) {
      return { success: false, reason: 'Read denied' };
    }

    if (!fs.existsSync(filePath)) {
      return { success: false, reason: 'File not found' };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  }

  async safeDelete(filePath: string): Promise<{ success: boolean; reason?: string }> {
    const decision = this.checkPermission(filePath, 'delete');

    if (decision === ModificationDecision.ALLOW) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    }

    return { success: false, reason: 'Deletion denied' };
  }

  getFileInfo(filePath: string): FileInfo {
    const { zone, reason } = this.classifyPath(filePath);
    const decision = this.checkPermission(filePath, 'write');

    return {
      path: path.resolve(filePath),
      zone,
      canModify: decision === ModificationDecision.ALLOW,
      reason,
    };
  }

  private logAudit(entry: any): void {
    this.auditLog.push({ ...entry, timestamp: new Date().toISOString() });
  }

  getAuditLog(): any[] {
    return [...this.auditLog];
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }
}

export class GuardianTestSuite {
  private guardian: GuardianTestModule;
  private testResults: TestResult[] = [];
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.guardian = new GuardianTestModule({
      workspacePath,
      sandboxPath: path.join(workspacePath, '.sandbox'),
      enabled: true,
    });
  }

  private addResult(testName: string, passed: boolean, details?: string): void {
    this.testResults.push({ testName, passed, details });
  }

  testZoneClassification(): void {
    const testCases = [
      { path: path.join(this.workspacePath, 'test.txt'), expectedZone: ZoneType.WORKSPACE },
      { path: path.join(this.workspacePath, '.sandbox', 'test.txt'), expectedZone: ZoneType.SANDBOX },
      { path: '/etc/passwd', expectedZone: ZoneType.SYSTEM },
      { path: '/bin/bash', expectedZone: ZoneType.SYSTEM },
      { path: process.env.HOME + '/Projects/test.txt', expectedZone: ZoneType.DEVELOPMENT },
    ];

    for (const testCase of testCases) {
      const { zone } = this.guardian.classifyPath(testCase.path);
      const passed = zone === testCase.expectedZone;
      this.addResult(`Zone classification for ${testCase.path}`, passed, passed ? '' : `Expected ${testCase.expectedZone}, got ${zone}`);
    }
  }

  async testFileWriteSafety(): Promise<void> {
    const workspaceFile = path.join(this.workspacePath, 'safe-write-test.txt');
    const systemFile = '/etc/test-file.txt';

    const workspaceWrite = await this.guardian.safeWrite(workspaceFile, 'safe content');
    const systemWrite = await this.guardian.safeWrite(systemFile, 'dangerous content');

    this.addResult('Workspace file write allowed', workspaceWrite.success);
    this.addResult('System file write blocked', !systemWrite.success);

    if (workspaceWrite.success && fs.existsSync(workspaceFile)) {
      fs.unlinkSync(workspaceFile);
    }
  }

  async testFileReadSafety(): Promise<void> {
    const workspaceFile = path.join(this.workspacePath, 'safe-read-test.txt');
    fs.writeFileSync(workspaceFile, 'test content');

    const readResult = await this.guardian.safeRead(workspaceFile);
    this.addResult('Workspace file read allowed', readResult.success);

    const systemRead = await this.guardian.safeRead('/etc/passwd');
    this.addResult('System file read blocked', !systemRead.success);

    if (fs.existsSync(workspaceFile)) {
      fs.unlinkSync(workspaceFile);
    }
  }

  async testFileDeleteSafety(): Promise<void> {
    const workspaceFile = path.join(this.workspacePath, 'safe-delete-test.txt');
    fs.writeFileSync(workspaceFile, 'test content');

    const deleteResult = await this.guardian.safeDelete(workspaceFile);
    this.addResult('Workspace file delete allowed', deleteResult.success);

    const systemDelete = await this.guardian.safeDelete('/etc/test-file.txt');
    this.addResult('System file delete blocked', !systemDelete.success);
  }

  testAuditLog(): void {
    this.guardian.clearAuditLog();

    const testPath = path.join(this.workspacePath, 'audit-test.txt');
    this.guardian.safeWrite(testPath, 'audit test');
    this.guardian.safeRead(testPath);
    this.guardian.safeDelete(testPath);

    const auditLog = this.guardian.getAuditLog();
    const passed = auditLog.length >= 3;

    this.addResult('Audit log captures operations', passed, `Found ${auditLog.length} entries`);
  }

  testFileInfo(): void {
    const workspaceFile = path.join(this.workspacePath, 'info-test.txt');
    const fileInfo = this.guardian.getFileInfo(workspaceFile);

    const passed = fileInfo.zone === ZoneType.WORKSPACE && fileInfo.canModify;
    this.addResult('File info returns correct zone', passed, `Zone: ${fileInfo.zone}, Can modify: ${fileInfo.canModify}`);
  }

  async runAllTests(): Promise<TestResult[]> {
    this.testZoneClassification();
    await this.testFileWriteSafety();
    await this.testFileReadSafety();
    await this.testFileDeleteSafety();
    this.testAuditLog();
    this.testFileInfo();

    return this.testResults;
  }

  generateReport(): string {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;

    return `# Guardian Test Report\n\n` +
      `**Total Tests**: ${total}\n` +
      `**Passed**: ${passed}\n` +
      `**Failed**: ${failed}\n` +
      `**Success Rate**: ${((passed / total) * 100).toFixed(1)}%\n\n` +
      `## Test Results\n\n` +
      this.testResults.map(r => `- [${r.passed ? 'x' : ' '}] ${r.testName}${r.details ? ` - ${r.details}` : ''}`).join('\n');
  }
}
