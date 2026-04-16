import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "fs";
import { join } from "path";
export class SessionDB {
    sessionsPath;
    snapshotsPath;
    constructor(worktree) {
        this.sessionsPath = join(worktree, ".hermes", "sessions");
        this.snapshotsPath = join(worktree, ".hermes", "snapshots");
        this.ensureDirs();
    }
    ensureDirs() {
        if (!existsSync(this.sessionsPath)) {
            mkdirSync(this.sessionsPath, { recursive: true });
        }
        if (!existsSync(this.snapshotsPath)) {
            mkdirSync(this.snapshotsPath, { recursive: true });
        }
    }
    saveSession(session) {
        const path = join(this.sessionsPath, `${session.id}.json`);
        writeFileSync(path, JSON.stringify(session, null, 2));
    }
    loadSession(sessionId) {
        const path = join(this.sessionsPath, `${sessionId}.json`);
        if (!existsSync(path))
            return null;
        return JSON.parse(readFileSync(path, "utf-8"));
    }
    listSessions() {
        const files = readdirSync(this.sessionsPath).filter((f) => f.endsWith(".json"));
        return files.map((f) => {
            const path = join(this.sessionsPath, f);
            return JSON.parse(readFileSync(path, "utf-8"));
        });
    }
    deleteSession(sessionId) {
        const path = join(this.sessionsPath, `${sessionId}.json`);
        if (existsSync(path)) {
            rmSync(path);
        }
    }
    saveSnapshot(snapshot) {
        const path = join(this.snapshotsPath, `${snapshot.id}.json`);
        writeFileSync(path, JSON.stringify(snapshot, null, 2));
    }
    listSnapshots(sessionId) {
        const files = readdirSync(this.snapshotsPath).filter((f) => f.endsWith(".json"));
        return files
            .map((f) => {
            const path = join(this.snapshotsPath, f);
            return JSON.parse(readFileSync(path, "utf-8"));
        })
            .filter((s) => !sessionId || s.sessionId === sessionId);
    }
    loadSnapshot(snapshotId) {
        const path = join(this.snapshotsPath, `${snapshotId}.json`);
        if (!existsSync(path))
            return null;
        return JSON.parse(readFileSync(path, "utf-8"));
    }
}
export function createSessionDB(worktree) {
    return new SessionDB(worktree);
}
