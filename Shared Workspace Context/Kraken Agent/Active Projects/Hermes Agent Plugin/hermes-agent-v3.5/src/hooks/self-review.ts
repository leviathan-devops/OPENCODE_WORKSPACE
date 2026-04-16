import type { Hooks } from "@opencode-ai/plugin";
import { isHermesAgent } from "../config/agent-identity.js";

export function createSelfReviewHook(): NonNullable<
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

    if (content.includes("approved") || content.includes("looks good")) {
      const textPartIndex = parts.findIndex(
        (p: any) => p?.type === "text" && p.text !== undefined
      );

      if (textPartIndex !== -1) {
        const originalText = (parts[textPartIndex] as any).text ?? "";
        (parts[textPartIndex] as any).text = `${originalText}\n\n[SELF-REVIEW CHECK] Did you verify this yourself? If so, please provide evidence (test output, command results). Agents cannot approve their own work without external verification.`;
      }
    }
  };
}
