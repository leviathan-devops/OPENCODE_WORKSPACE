import type { Hooks } from "@opencode-ai/plugin";
import { PHASES } from "../config/constants.js";
import { isHermesAgent } from "../config/agent-identity.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const PHASE_DIR = join(process.cwd(), ".hermes");
const PHASE_FILE = join(PHASE_DIR, "phase.json");

let _currentPhase: string = PHASES.IDLE;
let _phaseLoaded = false;

function loadPhaseFromDisk(): string {
  try {
    if (existsSync(PHASE_FILE)) {
      const data = JSON.parse(readFileSync(PHASE_FILE, "utf-8"));
      return data.phase ?? PHASES.IDLE;
    }
  } catch { /* ignore */ }
  return PHASES.IDLE;
}

function savePhaseToDisk(phase: string): void {
  try {
    if (!existsSync(PHASE_DIR)) mkdirSync(PHASE_DIR, { recursive: true });
    writeFileSync(PHASE_FILE, JSON.stringify({ phase, updatedAt: new Date().toISOString() }));
  } catch { /* ignore */ }
}

export function getCurrentPhase(): string {
  if (!_phaseLoaded) {
    _currentPhase = loadPhaseFromDisk();
    _phaseLoaded = true;
  }
  return _currentPhase;
}

export function setCurrentPhase(phase: string): void {
  _currentPhase = phase;
  _phaseLoaded = true;
  savePhaseToDisk(phase);
}

export function createBrainstormGateHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;

    const phase = getCurrentPhase();

    if (phase !== PHASES.IDLE && phase !== PHASES.ANALYZE && phase !== PHASES.PLAN) {
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
      const designDocPath = join(input.worktree ?? ".", "design.md");
      const designExists = existsSync(designDocPath);
      let designApproved = false;

      if (designExists) {
        try {
          const designContent = readFileSync(designDocPath, "utf-8");
          designApproved = designContent.includes("[APPROVED]");
        } catch {
          // Can't read design doc — treat as not approved
        }
      }

      if (!designExists) {
        const textPartIndex = parts.findIndex(
          (p: any) => p?.type === "text" && p.text !== undefined
        );
        if (textPartIndex !== -1) {
          const originalText = (parts[textPartIndex] as any).text ?? "";
          (parts[textPartIndex] as any).text = `${originalText}\n\n[BRAINSTORM GATE] Cannot write files or make edits in ${phase} phase. Create a design.md at the project root first.

Please continue with the brainstorm. Write the design doc before implementation.`;
        }
        return;
      }

      if (!designApproved) {
        const textPartIndex = parts.findIndex(
          (p: any) => p?.type === "text" && p.text !== undefined
        );
        if (textPartIndex !== -1) {
          const originalText = (parts[textPartIndex] as any).text ?? "";
          (parts[textPartIndex] as any).text = `${originalText}\n\n[BRAINSTORM GATE] Design doc exists but is not yet approved. Add [APPROVED] marker to design.md before proceeding with implementation.

Current phase: ${phase}. Awaiting design approval.`;
        }
        return;
      }
    }
  };
}
