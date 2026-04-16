/**
 * Mattermost HTTP API Client
 *
 * Handles HTTP API calls to Mattermost for posting messages,
 * file uploads, and channel operations.
 */
export interface MattermostHTTPConfig {
    url: string;
    token: string;
}
export interface ChannelInfo {
    id: string;
    name: string;
    display_name: string;
    type: 'D' | 'O' | 'P' | 'G';
    team_id: string;
}
export interface PostResponse {
    id: string;
    channel_id: string;
    user_id: string;
    message: string;
    create_at: number;
}
export declare class MattermostHTTPClient {
    private baseUrl;
    private token;
    constructor(config: MattermostHTTPConfig);
    private getHeaders;
    private request;
    getMe(): Promise<any>;
    getChannel(channelId: string): Promise<ChannelInfo>;
    getChannelPosts(channelId: string, since?: number): Promise<{
        posts: Record<string, any>;
        order: string[];
    }>;
    createPost(channelId: string, message: string, rootId?: string, fileIds?: string[]): Promise<PostResponse>;
    createPostWithFile(channelId: string, message: string, fileData: Buffer, fileName: string, rootId?: string): Promise<PostResponse>;
    uploadFile(channelId: string, fileData: Buffer, fileName: string): Promise<string | null>;
    sendTyping(channelId: string, userId: string): Promise<void>;
    listTeams(): Promise<any[]>;
    listChannels(teamId: string): Promise<ChannelInfo[]>;
    private truncateMessage;
}
//# sourceMappingURL=mattermost_http.d.ts.map