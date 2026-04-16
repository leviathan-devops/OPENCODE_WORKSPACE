/**
 * Mattermost Polling Listener
 * 
 * Polls the Mattermost API for new messages instead of using WebSocket.
 * This is a fallback when WebSocket connections are not available.
 */

import { EventEmitter } from 'events';
import { MattermostHTTPClient } from './mattermost_http.js';

export interface MattermostPollingConfig {
  url: string;
  token: string;
  botUsername: string;
  botUserId: string;
  channelIds: string[];
  pollInterval: number; // ms
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

export class MattermostPollingListener extends EventEmitter {
  private http: MattermostHTTPClient;
  private config: MattermostPollingConfig;
  private lastTimestamps: Map<string, number> = new Map();
  private pollTask: NodeJS.Timeout | null = null;
  private running = false;

  constructor(config: MattermostPollingConfig) {
    super();
    this.config = config;
    this.http = new MattermostHTTPClient({ url: config.url, token: config.token });
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    console.log('[MattermostPolling] Starting...');
    
    // Initialize timestamps for each channel
    for (const channelId of this.config.channelIds) {
      this.lastTimestamps.set(channelId, Date.now());
    }

    // Initial fetch
    await this.poll();

    // Start polling
    this.pollTask = setInterval(() => this.poll(), this.config.pollInterval);
    console.log(`[MattermostPolling] Started polling ${this.config.channelIds.length} channels every ${this.config.pollInterval}ms`);
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.pollTask) {
      clearInterval(this.pollTask);
      this.pollTask = null;
    }

    console.log('[MattermostPolling] Stopped');
  }

  private async poll(): Promise<void> {
    for (const channelId of this.config.channelIds) {
      try {
        await this.pollChannel(channelId);
      } catch (error) {
        console.error(`[MattermostPolling] Error polling channel ${channelId}:`, error);
      }
    }
  }

  private async pollChannel(channelId: string): Promise<void> {
    const since = this.lastTimestamps.get(channelId) || (Date.now() - 60000);
    
    try {
      const result = await this.http.getChannelPosts(channelId, since);
      const posts = result.posts;

      // Process posts newest first
      const orderedPosts = result.order.slice().reverse();
      
      for (const postId of orderedPosts) {
        const post = posts[postId];
        if (!post) continue;

        // Skip posts from the bot itself
        if (post.user_id === this.config.botUserId) continue;

        // Skip old posts
        if (post.create_at <= since) continue;

        // Update timestamp
        if (post.create_at > since) {
          this.lastTimestamps.set(channelId, post.create_at);
        }

        // Check if message mentions the bot
        const mentionPattern = new RegExp(`@${this.config.botUsername}\\b`, 'i');
        const hasMention = mentionPattern.test(post.message);
        const isFreeChannel = this.config.freeResponseChannels?.includes(channelId) || false;

        if (this.config.requireMention && !hasMention && !isFreeChannel) {
          continue;
        }

        // Emit the mention event
        this.emit('mention', {
          postId: post.id,
          channelId: post.channel_id,
          userId: post.user_id,
          message: post.message,
          timestamp: post.create_at,
          mentions: hasMention ? [this.config.botUsername] : [],
        });
      }
    } catch (error) {
      console.error(`[MattermostPolling] Failed to poll channel ${channelId}:`, error);
    }
  }
}