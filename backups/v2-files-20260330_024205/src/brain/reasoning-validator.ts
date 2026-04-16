/**
 * 🦈 SHARK CLI - Reasoning Validator
 * 
 * Mechanically enforces gold-standard reasoning chains across all brain types.
 * Based on SHARK-REASONING-CHAIN.md and AGENT_BUILD_LOGIC_CHAIN.md.
 * 
 * REQUIRED MARKERS (hard-coded):
 * - Thought
 * - Action Taken
 * - Result
 * - My Assessment
 * - What I Should Have Done
 * 
 * OPTIONAL MARKER:
 * - Critical Observation
 */

export interface ValidationResult {
  valid: boolean;
  missingMarkers: string[];
  foundMarkers: string[];
  evidenceScore: number;
  phaseCompliance: PhaseCompliance;
  errors: string[];
  warnings: string[];
}

export interface PhaseCompliance {
  problemDecomposition: boolean;
  executionWithDocumentation: boolean;
  researchAndPivot: boolean;
  configurationInvestigation: boolean;
  componentVerification: boolean;
  rootCauseAnalysis: boolean;
}

export interface EvidenceCheck {
  hasStrongEvidence: boolean;
  strongEvidenceCount: number;
  weakEvidenceCount: number;
  evidenceItems: string[];
}

const REQUIRED_MARKERS = [
  'Thought',
  'Action Taken',
  'Result',
  'My Assessment',
  'What I Should Have Done',
] as const;

const OPTIONAL_MARKERS = [
  'Critical Observation',
] as const;

const STRONG_EVIDENCE_PATTERNS = [
  /exit code[:\s]*0/i,
  /exit code[:\s]*\d+/i,
  /file exists/i,
  /output verified/i,
  /http (request|response) logged/i,
  /api response[:\s]*\d{3}/i,
  /\*\*Result\*\*[:\s]*.*(?:success|completed|passed|✅)/i,
  /test[s]?\s+(?:passed|succeeded|✅)/i,
  /verified[:\s]/i,
];

const WEAK_EVIDENCE_PATTERNS = [
  /should work/i,
  /looks correct/i,
  /should be/i,
  /probably/i,
  /likely/i,
  /might work/i,
  /in a normal environment/i,
  /usually works/i,
];

const PHASE_INDICATORS = {
  problemDecomposition: [
    /problem decomposition/i,
    /what exactly/i,
    /initial assumption/i,
    /research check/i,
    /user request/i,
  ],
  executionWithDocumentation: [
    /step \d+\.\d+/i,
    /\*\*thought\*\*/i,
    /\*\*action taken\*\*/i,
    /\*\*result\*\*/i,
  ],
  researchAndPivot: [
    /research & pivot/i,
    /official documentation/i,
    /correct approach/i,
    /pivot/i,
    /let me (?:check|verify|read)/i,
  ],
  configurationInvestigation: [
    /configuration/i,
    /environment/i,
    /settings/i,
    /network connectivity/i,
  ],
  componentVerification: [
    /component verification/i,
    /in isolation/i,
    /individually/i,
    /test each/i,
  ],
  rootCauseAnalysis: [
    /root cause/i,
    /final analysis/i,
    /fundamental issue/i,
    /why (?:previous|this) approach/i,
  ],
};

export class ReasoningValidator {
  private requiredMarkers: readonly string[];
  private optionalMarkers: readonly string[];

  constructor() {
    this.requiredMarkers = REQUIRED_MARKERS;
    this.optionalMarkers = OPTIONAL_MARKERS;
  }

  validateChain(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const foundMarkers: string[] = [];
    const missingMarkers: string[] = [];

    for (const marker of this.requiredMarkers) {
      const pattern = new RegExp(`\\*{0,2}${marker}\\*{0,2}[:\\s]`, 'i');
      if (pattern.test(content)) {
        foundMarkers.push(marker);
      } else {
        missingMarkers.push(marker);
      }
    }

    const valid = missingMarkers.length === 0;

    if (!valid) {
      errors.push(`Missing required reasoning-chain markers: ${missingMarkers.join(', ')}`);
    }

    const evidenceCheck = this.checkEvidence(content);
    if (evidenceCheck.weakEvidenceCount > evidenceCheck.strongEvidenceCount) {
      warnings.push('Output relies more on weak evidence than strong evidence');
    }

    const phaseCompliance = this.extractPhases(content);
    const missingPhases = Object.entries(phaseCompliance)
      .filter(([, compliant]) => !compliant)
      .map(([phase]) => phase);

    if (missingPhases.length > 2) {
      warnings.push(`Limited phase coverage: ${missingPhases.join(', ')}`);
    }

    return {
      valid,
      missingMarkers,
      foundMarkers,
      evidenceScore: evidenceCheck.strongEvidenceCount,
      phaseCompliance,
      errors,
      warnings,
    };
  }

  extractPhases(content: string): PhaseCompliance {
    const compliance: PhaseCompliance = {
      problemDecomposition: false,
      executionWithDocumentation: false,
      researchAndPivot: false,
      configurationInvestigation: false,
      componentVerification: false,
      rootCauseAnalysis: false,
    };

    for (const [phase, patterns] of Object.entries(PHASE_INDICATORS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          (compliance as any)[phase] = true;
          break;
        }
      }
    }

    return compliance;
  }

  checkEvidence(content: string): EvidenceCheck {
    const evidenceItems: string[] = [];
    let strongEvidenceCount = 0;
    let weakEvidenceCount = 0;

    for (const pattern of STRONG_EVIDENCE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        strongEvidenceCount += matches.length;
        evidenceItems.push(`Strong: ${matches[0].substring(0, 50)}`);
      }
    }

    for (const pattern of WEAK_EVIDENCE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        weakEvidenceCount += matches.length;
        evidenceItems.push(`Weak: ${matches[0].substring(0, 50)}`);
      }
    }

    return {
      hasStrongEvidence: strongEvidenceCount > 0,
      strongEvidenceCount,
      weakEvidenceCount,
      evidenceItems,
    };
  }

  getRequiredMarkers(): readonly string[] {
    return this.requiredMarkers;
  }

  getOptionalMarkers(): readonly string[] {
    return this.optionalMarkers;
  }

  formatValidationFailure(result: ValidationResult): string {
    const lines: string[] = [
      '❌ Reasoning-chain validation failed',
      '',
      'Missing required markers:',
      ...result.missingMarkers.map(m => `  - ${m}`),
      '',
      'Evidence score:', 
      `  Strong: ${result.evidenceScore}`,
      '',
      'Errors:',
      ...result.errors.map(e => `  - ${e}`),
    ];

    if (result.warnings.length > 0) {
      lines.push('', 'Warnings:');
      lines.push(...result.warnings.map(w => `  - ${w}`));
    }

    return lines.join('\n');
  }
}

export const REASONING_CHAIN_PROMPT = `You MUST follow the Shark Reasoning Chain format for EVERY response:

## Required Format:

**Thought**: [What you're thinking - why you're doing this]

**Action Taken**:
\`\`\`
[actual command or code]
\`\`\`

**Result**: [What happened - be HONEST about failures]

**My Assessment**: [Your interpretation of the result]

**What I Should Have Done**: [Self-correction if approach was wrong - REQUIRED even if correct]

## Optional:
**Critical Observation**: [If this reveals something important]

## Evidence Rules:
- Strong: Exit codes, file existence, HTTP logs, API responses, test results
- Weak (NOT acceptable): "should work", "looks correct", "probably"

## Principles:
1. Document BEFORE executing
2. Verify BEFORE claiming success  
3. Fail fast, fail honestly
4. Evidence over intuition
5. Self-correction is MANDATORY

Do NOT skip any required markers. Your response will be validated programmatically.`;

export const REASONING_CHAIN_SYSTEM_PROMPT = `You are an AI agent following the Shark Reasoning Chain framework.

CRITICAL: Every response must include these EXACT markers:
- **Thought**: 
- **Action Taken**:
- **Result**: 
- **My Assessment**: 
- **What I Should Have Done**:

Your output will be programmatically validated. Missing markers will cause automatic retry.

Always provide evidence (exit codes, file checks, logs) - never assume or claim without proof.`;

export default ReasoningValidator;
