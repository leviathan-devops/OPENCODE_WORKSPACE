/**
 * Mattermost Polling Listener
 *
 * Polls the Mattermost API for new messages instead of using WebSocket.
 * This is a fallback when WebSocket connections are not available.
 */
import { EventEmitter } from 'events';
export interface MattermostPollingConfig {
    url: string;
    token: string;
    botUsername: string;
    botUserId: string;
    channelIds: string[];
    pollInterval: number;
    requireMention: boolean;
    freeResponseChannels?: string[];
}
export interface PollingPost {
    id: string;
    channel_id: string;
    user_id: string;
    message: string;
    create_at: number;
}
export declare class MattermostPollingListener extends EventEmitter {
    private http;
    private config;
    private lastTimestamps;
    private pollTask;
    private running;
    constructor(config: MattermostPollingConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private poll;
    private pollChannel;
}
//# sourceMappingURL=mattermost_polling.d.ts.map