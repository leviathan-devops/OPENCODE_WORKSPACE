import { checkWorkflowEnforcement } from '../workflow/enforcer';
import { WorkflowStep } from '../workflow/machine';
import { detectMockMode } from '../validation/mock-detector';
import { enforceStyleGuide } from '../validation/style-enforcer';
import { preventRepoRootTests } from '../validation/test-enforcer';
import { enforceVerificationGates } from '../verification/gates';
import { validateDocumentation } from '../validation/doc-validator';
import { AuditLogger } from './audit-logger';
import { checkGuardianProtection } from './guardian-enhancer';
import { MechanicalValidator } from '../shark-core/anti-hallucination/mechanical-validator';

const validator = new MechanicalValidator();

export interface EnforcementParams {
  tool: string;
  args: any;
  sessionID: string;
  workflowStep: WorkflowStep;
  agent: string;
  context?: any;
}

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  firewall?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'none';
  auditId?: string;
}

function isSharkAgent(agent: string): boolean {
  console.log(`[DEBUG] isSharkAgent check: agent=${agent}`);
  return agent === 'shark' || agent.startsWith('shark-');
}

export async function enforceSharkArchitecture(params: EnforcementParams): Promise<EnforcementResult> {
  const audit = new AuditLogger(params.sessionID);
  const startTime = Date.now();

  console.log(`[DEBUG] enforceSharkArchitecture: tool=${params.tool}, agent=${params.agent}, session=${params.sessionID}`);

  // IDENTITY WALL: Only enforce for Shark agents
  if (!isSharkAgent(params.agent)) {
    console.log(`[DEBUG] enforceSharkArchitecture: Skipping enforcement for non-Shark agent: ${params.agent}`);
    return { allowed: true, auditId: audit.getId() };
  }

  console.log(`[DEBUG] enforceSharkArchitecture: Enforcing for Shark agent: ${params.agent}`);

  try {
    // Firewall 1: Guardian Protection (CRITICAL) - blocks personal/system paths
    const guardianCheck = await checkGuardianProtection(params.tool, params.args);
    if (!guardianCheck.allowed) {
      audit.log({
        firewall: 'guardian',
        tool: params.tool,
        action: 'blocked',
        reason: guardianCheck.reason,
        severity: 'critical',
        duration: Date.now() - startTime
      });
      return { ...guardianCheck, firewall: 'guardian', severity: 'critical', auditId: audit.getId() };
    }

    // Firewall 1.1: Shell-Guard (CRITICAL) - blocks unauthorized in-place modifications
    if (params.tool === 'bash' || params.tool === 'terminal' || params.tool === 'shell') {
      const cmd = (params.args.command as string) || (params.args.cmd as string) || '';
      const forbiddenPatterns = [
        /sed\s+-i/i,
        /echo\s+.*>\s+.*(\.ts|\.js|\.py|\.html|\.css)/i,
        /printf\s+.*>\s+.*(\.ts|\.js|\.py|\.html|\.css)/i,
        /cat\s+.*>\s+.*(\.ts|\.js|\.py|\.html|\.css)/i
      ];

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(cmd)) {
          const reason = `🦈 MECHANICAL BLOCK: Unauthorized in-place modification detected via '${cmd}'. Use the 'edit' tool to maintain history and avoid slop.`;
          audit.log({
            firewall: 'shell-guard',
            tool: params.tool,
            action: 'blocked',
            reason,
            severity: 'critical',
            duration: Date.now() - startTime
          });
          return { allowed: false, reason, firewall: 'shell-guard', severity: 'critical', auditId: audit.getId() };
        }
      }
    }

    // Firewall 2: 5-Step Workflow (CRITICAL)
    const workflowCheck = await checkWorkflowEnforcement(params);
    if (!workflowCheck.allowed) {
      audit.log({
        firewall: 'workflow',
        tool: params.tool,
        action: 'blocked',
        reason: workflowCheck.reason,
        severity: 'critical',
        duration: Date.now() - startTime
      });
      return { ...workflowCheck, firewall: 'workflow', severity: 'critical', auditId: audit.getId() };
    }

    // Firewall 3: Mock Mode Prevention (HIGH)
    const mockCheck = await detectMockMode(params.args);
    if (!mockCheck.allowed) {
      audit.log({
        firewall: 'mock-mode',
        tool: params.tool,
        action: 'blocked',
        reason: mockCheck.reason,
        severity: 'high',
        duration: Date.now() - startTime
      });
      return { ...mockCheck, firewall: 'mock-mode', severity: 'high', auditId: audit.getId() };
    }

    // Firewall 4: Mechanical Validation (HIGH/MEDIUM)
    if (params.tool === 'write' || params.tool === 'edit' || params.tool === 'write_file') {
      const content = (params.args.content as string) || (params.args.newString as string) || '';
      const diff = (params.args.diff as string) || '';

      // 4.1 Theatrical Detection
      const theatrical = validator.detectTheatrical(content);
      if (!theatrical.allowed) {
        audit.log({ firewall: 'theatrical', tool: params.tool, action: 'blocked', reason: theatrical.reason, severity: theatrical.severity, duration: Date.now() - startTime });
        return { ...theatrical, firewall: 'theatrical', auditId: audit.getId() };
      }

      // 4.2 Complexity Detection
      const complexity = validator.validateComplexity(content);
      if (!complexity.allowed) {
        audit.log({ firewall: 'complexity', tool: params.tool, action: 'blocked', reason: complexity.reason, severity: complexity.severity, duration: Date.now() - startTime });
        return { ...complexity, firewall: 'complexity', auditId: audit.getId() };
      }

      // 4.3 Precision Detection
      const precision = validator.validatePrecision(content, diff);
      if (!precision.allowed) {
        audit.log({ firewall: 'precision', tool: params.tool, action: 'blocked', reason: precision.reason, severity: precision.severity, duration: Date.now() - startTime });
        return { ...precision, firewall: 'precision', auditId: audit.getId() };
      }

      // 4.4 Observability Detection
      const observability = validator.validateObservability(content);
      if (!observability.allowed) {
        audit.log({ firewall: 'observability', tool: params.tool, action: 'blocked', reason: observability.reason, severity: observability.severity, duration: Date.now() - startTime });
        return { ...observability, firewall: 'observability', auditId: audit.getId() };
      }

      // 4.5 Integration Detection
      const integration = validator.validateIntegration(content);
      if (!integration.allowed) {
        audit.log({ firewall: 'integration', tool: params.tool, action: 'blocked', reason: integration.reason, severity: integration.severity, duration: Date.now() - startTime });
        return { ...integration, firewall: 'integration', auditId: audit.getId() };
      }
    }

    // Firewall 5: Style Guide (MEDIUM)
    const styleCheck = await enforceStyleGuide(params);
    if (!styleCheck.allowed) {
      audit.log({
        firewall: 'style-guide',
        tool: params.tool,
        action: 'blocked',
        reason: styleCheck.reason,
        severity: 'medium',
        duration: Date.now() - startTime
      });
      return { ...styleCheck, firewall: 'style-guide', severity: 'medium', auditId: audit.getId() };
    }

    // Firewall 6: Repo Root Test Prevention (MEDIUM)
    const testCheck = await preventRepoRootTests(params);
    if (!testCheck.allowed) {
      audit.log({
        firewall: 'repo-root-tests',
        tool: params.tool,
        action: 'blocked',
        reason: testCheck.reason,
        severity: 'medium',
        duration: Date.now() - startTime
      });
      return { ...testCheck, firewall: 'repo-root-tests', severity: 'medium', auditId: audit.getId() };
    }

    // Firewall 7: 3-Verification Gates (MEDIUM)
    const gateCheck = await enforceVerificationGates(params);
    if (!gateCheck.allowed) {
      audit.log({
        firewall: 'verification-gates',
        tool: params.tool,
        action: 'blocked',
        reason: gateCheck.reason,
        severity: 'medium',
        duration: Date.now() - startTime
      });
      return { ...gateCheck, firewall: 'verification-gates', severity: 'medium', auditId: audit.getId() };
    }

    // Firewall 8: Theatrical Documentation (LOW)
    const docCheck = await validateDocumentation(params);
    if (!docCheck.allowed) {
      audit.log({
        firewall: 'documentation',
        tool: params.tool,
        action: 'blocked',
        reason: docCheck.reason,
        severity: 'low',
        duration: Date.now() - startTime
      });
      return { ...docCheck, firewall: 'documentation', severity: 'low', auditId: audit.getId() };
    }

    // All firewalls passed
    audit.log({
      firewall: 'all',
      tool: params.tool,
      action: 'allowed',
      reason: 'All firewalls passed',
      severity: 'none'
    });

    return { allowed: true, auditId: audit.getId() };

  } catch (error: any) {
    // On error, block by default (fail-safe)
    audit.log({
      firewall: 'error',
      tool: params.tool,
      action: 'error',
      reason: error.message,
      severity: 'critical'
    });

    return {
      allowed: false,
      reason: `Enforcement error: ${error.message}`,
      firewall: 'error',
      severity: 'critical',
      auditId: audit.getId()
    };
  }
}

