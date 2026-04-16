/**
 * Session Manager
 *
 * Manages per-channel sessions with Redis persistence.
 * Maps channel_id → session data including container assignment.
 */
import { ChannelSession } from '../mattermost/types.js';
export interface SessionManagerConfig {
    redisHost: string;
    redisPort: number;
    sessionTimeout: number;
}
export declare class SessionManager {
    private redis;
    private config;
    private localCache;
    private redisAvailable;
    constructor(config: SessionManagerConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private sessionKey;
    private containerKey;
    getSession(channelId: string): Promise<ChannelSession | null>;
    createSession(params: {
        channelId: string;
        channelName: string;
        containerId: string;
        containerName: string;
        agentType: ChannelSession['agentType'];
        plugins: string[];
        workspacePath: string;
        model: string;
    }): Promise<ChannelSession>;
    updateSession(channelId: string, updates: Partial<ChannelSession>): Promise<void>;
    deleteSession(channelId: string): Promise<void>;
    updateActivity(channelId: string): Promise<void>;
    getContainerForChannel(channelId: string): Promise<string | null>;
    listActiveSessions(): Promise<ChannelSession[]>;
    cleanupExpiredSessions(): Promise<number>;
    private saveSession;
}
//# sourceMappingURL=session_manager.d.ts.map