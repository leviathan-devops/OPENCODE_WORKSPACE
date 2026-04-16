import type { Hooks } from "@opencode-ai/plugin";

const INTENT_MARKERS = {
  STATUS_REQUEST: "[STATUS_REQUEST]",
  REVIEW_REQUEST: "[REVIEW_REQUEST]",
  ESCALATION_NOTICE: "[ESCALATION_NOTICE]",
  ACK: "[ACK]",
};

export function createIntentMarkerHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    const messages = output?.messages;
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.parts) return;

    const parts = lastMessage.parts;
    const content = JSON.stringify(parts);

    for (const [marker, description] of Object.entries(INTENT_MARKERS)) {
      if (content.includes(marker)) {
        const textPartIndex = parts.findIndex(
          (p: any) => p?.type === "text" && p.text !== undefined
        );

        if (textPartIndex !== -1 && marker === "ACK") {
          const originalText = (parts[textPartIndex] as any).text ?? "";
          (parts[textPartIndex] as any).text = `${originalText}\n\n[ INTENT MARKER: ${marker} ] ${description} - Terminal. Do not reply further.`;
        }
      }
    }
  };
}
