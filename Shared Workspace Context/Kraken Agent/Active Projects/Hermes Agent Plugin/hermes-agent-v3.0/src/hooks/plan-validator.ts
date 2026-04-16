import type { Hooks } from "@opencode-ai/plugin";
import { PLACEHOLDER_PATTERNS, PHASES } from "../config/constants.js";
import { getCurrentPhase } from "./brainstorm-gate.js";
import { isHermesAgent } from "../config/agent-identity.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const PLAN_SCHEMA = {
  requiredSections: [
    { pattern: /file[_\s]?path/i, label: "file paths" },
    { pattern: /test[_\s]?command/i, label: "test commands" },
    { pattern: /acceptance[_\s]?criter/i, label: "acceptance criteria" },
    { pattern: /phase/i, label: "phase definitions" },
  ],
  forbiddenPatterns: [
    { pattern: /\[file\]/i, label: "[file] placeholder" },
    { pattern: /\[path\]/i, label: "[path] placeholder" },
    { pattern: /\[command\]/i, label: "[command] placeholder" },
    { pattern: /\[description\]/i, label: "[description] placeholder" },
  ],
};

export function createPlanValidatorHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;

    const messages = output?.messages;
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.parts) return;

    const parts = lastMessage.parts;
    const content = JSON.stringify(parts);

    const currentPhase = getCurrentPhase();
    if (currentPhase !== PHASES.PLAN) return;

    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(content)) {
        const textPartIndex = parts.findIndex(
          (p: any) => p?.type === "text" && p.text !== undefined
        );

        if (textPartIndex !== -1) {
          const originalText = (parts[textPartIndex] as any).text ?? "";
          (parts[textPartIndex] as any).text = `${originalText}\n\n[PLAN VALIDATOR BLOCKED] Your plan contains "${pattern.source}" — this is not allowed.

Every step MUST have:
- Exact file paths
- Actual code (not stubs)
- Exact test commands with expected output
- Concrete acceptance criteria

Please revise the plan with specific, actionable items.`;
        }
        return;
      }
    }

    const missingSections = PLAN_SCHEMA.requiredSections.filter(
      (section) => !section.pattern.test(content)
    );
    if (missingSections.length > 0) {
      const textPartIndex = parts.findIndex(
        (p: any) => p?.type === "text" && p.text !== undefined
      );
      if (textPartIndex !== -1) {
        const originalText = (parts[textPartIndex] as any).text ?? "";
        (parts[textPartIndex] as any).text = `${originalText}\n\n[PLAN VALIDATOR BLOCKED] Plan is missing required sections: ${missingSections.map(s => s.label).join(", ")}.

A valid plan must include all of these sections with concrete content.`;
      }
      return;
    }

    const forbidden = PLAN_SCHEMA.forbiddenPatterns.filter(
      (fp) => fp.pattern.test(content)
    );
    if (forbidden.length > 0) {
      const textPartIndex = parts.findIndex(
        (p: any) => p?.type === "text" && p.text !== undefined
      );
      if (textPartIndex !== -1) {
        const originalText = (parts[textPartIndex] as any).text ?? "";
        (parts[textPartIndex] as any).text = `${originalText}\n\n[PLAN VALIDATOR BLOCKED] Plan contains forbidden placeholders: ${forbidden.map(f => f.label).join(", ")}.

Replace all placeholders with actual values.`;
      }
      return;
    }

    const claimsPath = join(input.worktree ?? ".", ".hermes", "claims.json");
    if (existsSync(claimsPath)) {
      try {
        const claims = JSON.parse(readFileSync(claimsPath, "utf-8"));
        if (claims.phases && Array.isArray(claims.phases)) {
          const claimPhases = claims.phases.map((p: any) => p?.name || p).filter(Boolean);
          const missingPhases = claimPhases.filter(
            (cp: string) => !content.toLowerCase().includes(cp.toLowerCase())
          );
          if (missingPhases.length > 0) {
            const textPartIndex = parts.findIndex(
              (p: any) => p?.type === "text" && p.text !== undefined
            );
            if (textPartIndex !== -1) {
              const originalText = (parts[textPartIndex] as any).text ?? "";
              (parts[textPartIndex] as any).text = `${originalText}\n\n[PLAN VALIDATOR BLOCKED] Plan does not cover all claimed phases: ${missingPhases.join(", ")}.

Every claimed phase in .hermes/claims.json must have a corresponding plan section.`;
            }
            return;
          }
        }
      } catch {
        // Claims file exists but is invalid — skip validation
      }
    }
  };
}
