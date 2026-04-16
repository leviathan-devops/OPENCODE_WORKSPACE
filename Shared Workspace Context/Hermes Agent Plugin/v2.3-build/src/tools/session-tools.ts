import { tool } from "./create-tool.js";
import { SessionDB } from "../services/session-db.js";

export const listSessions = tool({
  description: "List all saved sessions",
  args: {},
  execute: async (args, context) => {
    const db = new SessionDB(context.worktree);
    const sessions = db.listSessions();
    if (sessions.length === 0) {
      return `No saved sessions found.`;
    }
    return `Saved sessions:\n${sessions.map(s => `  - ${s.id}: phase=${s.phase}, updated=${s.updatedAt}`).join("\n")}`;
  },
});

export const loadSession = tool({
  description: "Load a saved session by ID",
  args: {
    sessionId: tool.schema.string().describe("Session ID to load"),
  },
  execute: async (args, context) => {
    const db = new SessionDB(context.worktree);
    const session = db.loadSession(args.sessionId);
    if (!session) {
      return `Session not found: ${args.sessionId}`;
    }
    return `Loaded session: ${session.id}
Phase: ${session.phase}
Created: ${session.createdAt}
Updated: ${session.updatedAt}
Metadata: ${JSON.stringify(session.metadata, null, 2)}`;
  },
});

export const forkSession = tool({
  description: "Fork a session from a past checkpoint",
  args: {
    snapshotId: tool.schema.string().describe("Snapshot ID to fork from"),
    label: tool.schema.string().optional().describe("Label for the fork"),
  },
  execute: async (args, context) => {
    const db = new SessionDB(context.worktree);
    const snapshot = db.loadSnapshot(args.snapshotId);
    if (!snapshot) {
      return `Snapshot not found: ${args.snapshotId}`;
    }
    const newSessionId = `fork_${Date.now()}`;
    const newSession = {
      id: newSessionId,
      phase: snapshot.phase,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        forkedFrom: args.snapshotId,
        label: args.label ?? "unnamed",
      },
    };
    db.saveSession(newSession);
    return `Forked session from snapshot: ${args.snapshotId}
Label: ${args.label ?? "unnamed"}
New session ID: ${newSessionId}`;
  },
});

export const createSnapshot = tool({
  description: "Create a session snapshot",
  args: {
    label: tool.schema.string().optional().describe("Snapshot label"),
  },
  execute: async (args, context) => {
    const db = new SessionDB(context.worktree);
    const snapshotId = `snap_${Date.now()}`;
    const snapshot = {
      id: snapshotId,
      sessionId: context.sessionID,
      timestamp: new Date().toISOString(),
      phase: "idle",
      messages: [],
      context: [],
    };
    db.saveSnapshot(snapshot);
    return `Snapshot created: ${snapshotId}
Label: ${args.label ?? "auto"}
Phase: idle
Timestamp: ${snapshot.timestamp}`;
  },
});
