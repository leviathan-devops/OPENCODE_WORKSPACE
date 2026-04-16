import type { Hooks } from "@opencode-ai/plugin";
import { PHASES } from "../config/constants.js";
import { isHermesAgent } from "../config/agent-identity.js";

let _currentPhase: string = PHASES.IDLE;

export function getCurrentPhase(): string {
  return _currentPhase;
}

export function setCurrentPhase(phase: string): void {
  _currentPhase = phase;
}

export function createBrainstormGateHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;

    const phase = getCurrentPhase();

    if (phase !== PHASES.IDLE && phase !== PHASES.ANALYZE) {
      return;
    }

    const messages = output?.messages;
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.parts) return;

    const parts = lastMessage.parts;
    const content = JSON.stringify(parts);
    const hasCodeBlocks = /```[\s\S]*?```/.test(content);
    const hasFileEdits =
      content.includes("write_file") ||
      content.includes("patch") ||
      content.includes("edit");
    const hasToolCalls =
      content.includes("mcp_") || content.includes("tool(");

    if (hasCodeBlocks || hasFileEdits || hasToolCalls) {
      const textPartIndex = parts.findIndex(
        (p: any) => p?.type === "text" && p.text !== undefined
      );

      if (textPartIndex !== -1) {
        const originalText = (parts[textPartIndex] as any).text ?? "";
        (parts[textPartIndex] as any).text = `${originalText}\n\n[HARD-GATE BLOCKED] You are in the BRAINSTORM phase. No implementation is permitted until:
1. Requirements are concrete (no "just build it")
2. Design doc is written to ~/hermes-workspace/docs/plans/
3. User has explicitly approved the design

Please continue with the brainstorm. Ask clarifying questions or write the design doc.`;
      }
    }
  };
}
