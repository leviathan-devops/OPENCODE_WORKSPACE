import type { Hooks } from "@opencode-ai/plugin";

const TOKEN_BUDGET_PERCENT_WARN = 70;
const TOKEN_BUDGET_PERCENT_CRITICAL = 90;

let contextBudgetUsed = 0;

export function createContextBudgetHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    const messages = output?.messages;
    if (!messages) return;

    let totalTokens = 0;
    for (const msg of messages) {
      const content = JSON.stringify(msg.parts);
      totalTokens += Math.ceil(content.length / 4);
    }

    contextBudgetUsed = totalTokens;

    if (totalTokens > TOKEN_BUDGET_PERCENT_CRITICAL * 1000) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.parts) {
        const textPartIndex = lastMessage.parts.findIndex(
          (p: any) => p?.type === "text" && p.text !== undefined
        );
        if (textPartIndex !== -1) {
          const originalText = (lastMessage.parts[textPartIndex] as any).text ?? "";
          (lastMessage.parts[textPartIndex] as any).text = `${originalText}\n\n[CONTEXT BUDGET] CRITICAL: ${totalTokens} tokens used. Consider running /compact or checkpointing.`;
        }
      }
    }
  };
}

export function getContextBudgetUsed(): number {
  return contextBudgetUsed;
}
