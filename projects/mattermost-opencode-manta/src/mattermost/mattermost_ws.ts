/**
 * Mattermost WebSocket Listener
 * 
 * Connects to Mattermost via WebSocket and listens for @mention events.
 * Based on hermes-agent's mattermost.py adapter pattern.
 */

import WebSocket from 'ws';
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

const RECONNECT_BASE_DELAY = 2.0;
const RECONNECT_MAX_DELAY = 60.0;
const RECONNECT_JITTER = 0.2;

export class MattermostWSListener extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: MattermostConfig;
  private closing = false;
  private reconnectDelay = RECONNECT_BASE_DELAY;
  private reconnectTask: NodeJS.Timeout | null = null;
  private seenPosts = new Map<string, number>();
  private readonly SEEN_MAX = 2000;
  private readonly SEEN_TTL = 300000;
  private authenticated = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private pendingReject: ((err: Error) => void) | null = null;

  constructor(config: MattermostConfig) {
    super();
    this.config = config;
  }

  private getWsUrl(): string {
    const baseUrl = this.config.url.replace(/^http/, 'ws');
    const wsUrl = new URL(`${baseUrl}/api/v4/websocket`);
    wsUrl.searchParams.set('token', this.config.token);
    return wsUrl.toString();
  }

  async connect(): Promise<boolean> {
    if (this.ws) {
      await this.disconnect();
    }

    this.closing = false;
    this.authenticated = false;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.getWsUrl());
      this.ws = ws;
      this.pendingReject = reject;

      this.connectionTimeout = setTimeout(() => {
        if (!this.authenticated) {
          ws.close();
          reject(new Error('WebSocket authentication timeout'));
        }
      }, 10000);

      ws.on('open', () => {
        console.log('[MattermostWS] Connected to WebSocket, waiting for hello...');
      });

      ws.on('message', (data: Buffer) => {
        this.handleMessage(data.toString(), () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          resolve(true);
        });
      });

      ws.on('close', (code, reason) => {
        console.log(`[MattermostWS] WebSocket closed: code=${code} reason=${reason?.toString() || 'none'}`);
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        if (!this.closing) {
          this.scheduleReconnect();
        }
      });

      ws.on('error', (error: Error) => {
        console.error('[MattermostWS] WebSocket error:', error.message);
        if (!this.closing) {
          this.scheduleReconnect();
        }
      });
    });
  }

  private authenticate(): void {
    if (!this.ws || this.authenticated) return;

    this.authenticated = true;

    const authMsg = {
      seq: 1,
      action: 'authentication_challenge',
      data: { token: this.config.token },
    };

    this.ws.send(JSON.stringify(authMsg));
    console.log('[MattermostWS] Authentication challenge sent');

    this.sendHello();
  }

  private sendHello(): void {
    if (!this.ws) return;

    const helloMsg = {
      seq: 2,
      action: 'hello',
      data: {
        user_id: this.config.botUserId,
        channel_id: '',
      },
    };

    this.ws.send(JSON.stringify(helloMsg));
  }

  private handleMessage(rawData: string, onAuthenticated?: () => void): void {
    try {
      const event: MattermostEvent = JSON.parse(rawData);
      const eventType = event.event;

      if (eventType === 'posted') {
        this.handlePostedEvent(event);
      } else if (eventType === 'hello') {
        console.log('[MattermostWS] Received hello, sending authentication...');
        this.reconnectDelay = RECONNECT_BASE_DELAY;
        this.authenticate();
      } else if (eventType === 'OK' && this.authenticated) {
        console.log('[MattermostWS] Authentication acknowledged');
        if (onAuthenticated) {
          onAuthenticated();
        }
      }
    } catch (error) {
      console.error('[MattermostWS] Failed to parse message:', error);
    }
  }

  private handlePostedEvent(event: MattermostEvent): void {
    const data = event.data;
    const rawPostStr = data.post;

    if (!rawPostStr) return;

    try {
      const post: MattermostPost = JSON.parse(rawPostStr);

      if (post.user_id === this.config.botUserId) {
        return;
      }

      if (post.type) {
        return;
      }

      const postId = post.id;

      if (this.isDuplicate(postId)) {
        return;
      }

      const messageText = post.message;
      const channelId = post.channel_id;
      const channelType = data.channel_type as 'D' | 'O' | 'P' | 'G';

      let hasMention = false;
      const mentionPatterns = [
        `@${this.config.botUsername}`,
        `@${this.config.botUserId}`,
      ];

      for (const pattern of mentionPatterns) {
        if (messageText.toLowerCase().includes(pattern.toLowerCase())) {
          hasMention = true;
          break;
        }
      }

      if (channelType !== 'D' && this.config.requireMention && !hasMention) {
        const isFreeChannel = this.config.freeResponseChannels.includes(channelId);
        if (!isFreeChannel) {
          console.log('[MattermostWS] Ignoring message without mention in channel');
          return;
        }
      }

      if (!this.config.allowedUsers.includes('*') && 
          !this.config.allowedUsers.includes(post.user_id)) {
        console.log('[MattermostWS] User not in allowed list, ignoring');
        return;
      }

      let cleanMessage = messageText;
      if (hasMention) {
        for (const pattern of mentionPatterns) {
          cleanMessage = cleanMessage.replace(
            new RegExp(pattern, 'gi'),
            ''
          ).trim();
        }
      }

      const mentionEvent: MentionEvent = {
        postId: post.id,
        channelId,
        channelType,
        userId: post.user_id,
        userName: data.sender_name || post.user_id,
        message: cleanMessage,
        rootId: post.root_id,
        mentions: mentionPatterns.filter(p => messageText.toLowerCase().includes(p.toLowerCase())),
        threadId: post.root_id || undefined,
        timestamp: Date.now(),
      };

      this.emit('mention', mentionEvent);

    } catch (error) {
      console.error('[MattermostWS] Failed to handle posted event:', error);
    }
  }

  private isDuplicate(postId: string): boolean {
    this.pruneSeen();

    if (this.seenPosts.has(postId)) {
      return true;
    }

    this.seenPosts.set(postId, Date.now());
    return false;
  }

  private pruneSeen(): void {
    if (this.seenPosts.size < this.SEEN_MAX) return;

    const now = Date.now();
    for (const [key, timestamp] of this.seenPosts) {
      if (now - timestamp > this.SEEN_TTL) {
        this.seenPosts.delete(key);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTask) {
      clearTimeout(this.reconnectTask);
    }

    if (this.pendingReject) {
      this.pendingReject(new Error('WebSocket closed before authentication'));
      this.pendingReject = null;
    }

    const jitter = this.reconnectDelay * RECONNECT_JITTER * Math.random();
    const delay = this.reconnectDelay + jitter;

    console.log(`[MattermostWS] Reconnecting in ${delay.toFixed(1)}s`);

    this.reconnectTask = setTimeout(async () => {
      await this.connect();
    }, delay * 1000);

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_DELAY);
  }

  async disconnect(): Promise<void> {
    this.closing = true;

    if (this.reconnectTask) {
      clearTimeout(this.reconnectTask);
      this.reconnectTask = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.pendingReject = null;

    console.log('[MattermostWS] Disconnected');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
