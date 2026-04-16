import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "fs";
import { join, resolve } from "path";

export interface SessionState {
  id: string;
  phase: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface SessionSnapshot {
  id: string;
  sessionId: string;
  timestamp: string;
  phase: string;
  messages: any[];
  context: string[];
}

export class SessionDB {
  private sessionsPath: string;
  private snapshotsPath: string;

  constructor(worktree: string) {
    this.sessionsPath = join(worktree, ".hermes", "sessions");
    this.snapshotsPath = join(worktree, ".hermes", "snapshots");
    this.ensureDirs();
  }

  private ensureDirs() {
    if (!existsSync(this.sessionsPath)) {
      mkdirSync(this.sessionsPath, { recursive: true });
    }
    if (!existsSync(this.snapshotsPath)) {
      mkdirSync(this.snapshotsPath, { recursive: true });
    }
  }

  saveSession(session: SessionState): void {
    const path = join(this.sessionsPath, `${session.id}.json`);
    writeFileSync(path, JSON.stringify(session, null, 2));
  }

  loadSession(sessionId: string): SessionState | null {
    const path = join(this.sessionsPath, `${sessionId}.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  }

  listSessions(): SessionState[] {
    const files = readdirSync(this.sessionsPath).filter((f) =>
      f.endsWith(".json")
    );
    return files.map((f) => {
      const path = join(this.sessionsPath, f);
      return JSON.parse(readFileSync(path, "utf-8"));
    });
  }

  deleteSession(sessionId: string): void {
    const path = join(this.sessionsPath, `${sessionId}.json`);
    if (existsSync(path)) {
      rmSync(path);
    }
  }

  saveSnapshot(snapshot: SessionSnapshot): void {
    const path = join(
      this.snapshotsPath,
      `${snapshot.id}.json`
    );
    writeFileSync(path, JSON.stringify(snapshot, null, 2));
  }

  listSnapshots(sessionId?: string): SessionSnapshot[] {
    const files = readdirSync(this.snapshotsPath).filter((f) =>
      f.endsWith(".json")
    );
    return files
      .map((f) => {
        const path = join(this.snapshotsPath, f);
        return JSON.parse(readFileSync(path, "utf-8"));
      })
      .filter((s) => !sessionId || s.sessionId === sessionId);
  }

  loadSnapshot(snapshotId: string): SessionSnapshot | null {
    const path = join(this.snapshotsPath, `${snapshotId}.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  }
}

export function createSessionDB(worktree: string): SessionDB {
  return new SessionDB(worktree);
}
