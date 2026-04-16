/**
 * Mattermost Type Definitions
 */
export type ChannelType = 'D' | 'O' | 'P' | 'G';
export type MessageType = 'TEXT' | 'COMMAND' | 'FILE' | 'MENTION';
export interface MattermostUser {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    nickname: string;
    roles: string;
}
export interface MattermostChannel {
    id: string;
    name: string;
    display_name: string;
    type: ChannelType;
    team_id: string;
    header: string;
    purpose: string;
    last_post_at: number;
    total_msg_count: number;
    extra_update_at: number;
    creator_id: string;
    scheme_id: string;
    props: Record<string, unknown>;
    group_constrained: boolean;
    total_msg_count_root: string;
}
export interface MattermostPost {
    id: string;
    channel_id: string;
    user_id: string;
    root_id: string;
    parent_id: string;
    message: string;
    type: string;
    props: Record<string, unknown>;
    hashtags: string;
    file_ids: string[];
    create_at: number;
    update_at: number;
    edit_at: number;
    delete_at: number;
    is_pinned: boolean;
    remote_id: string;
    broadcast: Record<string, unknown>;
    country: string;
    fyle: string;
    keyboard_frames: string;
    model: string;
    subtype: string;
    suggestion_id: string;
}
export interface MattermostFileInfo {
    id: string;
    user_id: string;
    post_id: string;
    channel_id: string;
    filename: string;
    original_filename: string;
    extension: string;
    size: number;
    mime_type: string;
    width: number;
    height: number;
    has_preview_image: boolean;
    create_at: number;
    delete_at: number;
}
export interface MattermostTeam {
    id: string;
    name: string;
    display_name: string;
    description: string;
    email: string;
    type: string;
    allowed_domains: string;
    invite_id: string;
    create_at: number;
    update_at: number;
}
export interface WebSocketEvent {
    event: string;
    data: Record<string, unknown>;
    broadcast: Record<string, unknown>;
    sequence: number;
}
export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export interface ChannelSession {
    sessionId: string;
    channelId: string;
    channelName: string;
    containerId: string;
    containerName: string;
    agentType: 'manta' | 'shark' | 'spider' | 'coder';
    plugins: string[];
    workspacePath: string;
    model: string;
    createdAt: number;
    lastActivity: number;
    status: 'active' | 'idle' | 'stopped' | 'error';
}
export interface MessageContext {
    sessionId: string;
    channelId: string;
    channelType: ChannelType;
    userId: string;
    userName: string;
    message: string;
    rootId?: string;
    threadId?: string;
    mentions: string[];
    timestamp: number;
}
export interface MattermostConfig {
    url: string;
    token: string;
    botUsername: string;
    botUserId: string;
    allowedUsers: string[];
    requireMention: boolean;
    freeResponseChannels: string[];
}
//# sourceMappingURL=types.d.ts.map