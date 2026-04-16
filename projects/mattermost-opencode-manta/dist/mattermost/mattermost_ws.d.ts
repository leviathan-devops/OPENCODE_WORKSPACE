/**
 * Mattermost WebSocket Listener
 *
 * Connects to Mattermost via WebSocket and listens for @mention events.
 * Based on hermes-agent's mattermost.py adapter pattern.
 */
import { EventEmitter } from 'events';
export interface MattermostConfig {
    url: string;
    token: string;
    botUsername: string;
    botUserId: string;
    allowedUsers: string[];
    requireMention: boolean;
    freeResponseChannels: string[];
}
export interface MattermostPost {
    id: string;
    channel_id: string;
    user_id: string;
    message: string;
    root_id: string;
    type: string;
    file_ids: string[];
}
export interface MattermostEvent {
    event: string;
    data: {
        channel_id: string;
        channel_type: string;
        post: string;
        sender_name: string;
        team_id?: string;
    };
}
export interface MentionEvent {
    postId: string;
    channelId: string;
    channelType: 'D' | 'O' | 'P' | 'G';
    userId: string;
    userName: string;
    message: string;
    rootId?: string;
    mentions: string[];
    threadId?: string;
    timestamp: number;
}
export declare class MattermostWSListener extends EventEmitter {
    private ws;
    private config;
    private closing;
    private reconnectDelay;
    private reconnectTask;
    private seenPosts;
    private readonly SEEN_MAX;
    private readonly SEEN_TTL;
    private authenticated;
    private connectionTimeout;
    private pendingReject;
    constructor(config: MattermostConfig);
    private getWsUrl;
    connect(): Promise<boolean>;
    private authenticate;
    private sendHello;
    private handleMessage;
    private handlePostedEvent;
    private isDuplicate;
    private pruneSeen;
    private scheduleReconnect;
    disconnect(): Promise<void>;
    isConnected(): boolean;
}
//# sourceMappingURL=mattermost_ws.d.ts.map