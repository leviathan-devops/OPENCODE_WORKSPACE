import * as path from 'path';
import * as os from 'os';

const PERSONAL_PATHS = [
  '.ssh',
  '.gnupg',
  '.password-store',
  '.config/gh',
  '.aws',
  '.azure',
  '.gcloud',
  '.kube',
  '.env',
  '.env.local',
  'credentials',
  'secrets',
  '.secrets'
];

const SYSTEM_PATHS_LINUX = [
  '/bin',
  '/sbin',
  '/usr/bin',
  '/usr/sbin',
  '/lib',
  '/lib64',
  '/usr/lib',
  '/etc',
  '/var',
  '/proc',
  '/sys',
  '/dev',
  '/boot',
  '/root'
];

const SYSTEM_PATHS_DARWIN = [
  '/System',
  '/Library',
  '/Applications',
  '/usr',
  '/bin',
  '/sbin',
  '/etc'
];

const SYSTEM_PATHS_WIN32 = [
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)'
];

export async function checkGuardianProtection(
  tool: string,
  args: any
): Promise<{ allowed: boolean; reason?: string }> {
  
  const filePath = extractFilePath(tool, args);
  if (!filePath) {
    return { allowed: true };
  }

  const absolutePath = path.resolve(filePath);
  const normalizedPath = absolutePath.toLowerCase();
  const homeDir = os.homedir().toLowerCase();
  const platform = process.platform;

  // Check PERSONAL paths (highest priority)
  for (const personalPath of PERSONAL_PATHS) {
    const fullPersonalPath = path.join(homeDir, personalPath).toLowerCase();
    if (normalizedPath.includes(fullPersonalPath)) {
      return {
        allowed: false,
        reason: `🦈 GUARDIAN BLOCKED: Personal/credential path detected - ${personalPath}. File operations to sensitive paths are prohibited.`
      };
    }
  }

  // Check SYSTEM paths based on platform
  let systemPaths: string[] = [];
  if (platform === 'linux') {
    systemPaths = SYSTEM_PATHS_LINUX;
  } else if (platform === 'darwin') {
    systemPaths = SYSTEM_PATHS_DARWIN;
  } else if (platform === 'win32') {
    systemPaths = SYSTEM_PATHS_WIN32;
  }

  for (const sysPath of systemPaths) {
    if (normalizedPath.startsWith(sysPath.toLowerCase())) {
      return {
        allowed: false,
        reason: `🦈 GUARDIAN BLOCKED: System path detected - ${sysPath}. Modifying system files is prohibited.`
      };
    }
  }

  // Special check for home directory root operations
  if (normalizedPath === homeDir || normalizedPath === homeDir + '/' || normalizedPath === homeDir + '\\') {
    return {
      allowed: false,
      reason: `🦈 GUARDIAN BLOCKED: Home directory root operations not allowed. Use workspace directory.`
    };
  }

  return { allowed: true };
}

function extractFilePath(tool: string, args: any): string | null {
  // Extract file path based on tool type
  switch (tool) {
    case 'write':
    case 'edit':
    case 'read':
    case 'delete':
      return args.filePath || args.path || args.file || null;
    
    case 'bash':
      // Extract file paths from bash commands
      const bashCmd = args.command || args.cmd || '';
      const pathMatch = bashCmd.match(/(?:^|\s)([\/~][^\s]*)/);
      return pathMatch ? pathMatch[1] : null;
    
    case 'glob':
    case 'grep':
      return args.path || args.pattern || null;
    
    default:
      return args.filePath || args.path || args.file || null;
  }
}
