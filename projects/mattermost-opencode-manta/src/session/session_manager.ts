/**
 * Session Manager
 * 
 * Manages per-channel sessions with Redis persistence.
 * Maps channel_id → session data including container assignment.
 */

import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { ChannelSession } from '../mattermost/types.js';

export interface SessionManagerConfig {
  redisHost: string;
  redisPort: number;
  sessionTimeout: number; // seconds
}

const DEFAULT_SESSION_TIMEOUT = 1800; // 30 minutes

export class SessionManager {
  private redis: RedisClientType;
  private config: SessionManagerConfig;
  private localCache = new Map<string, ChannelSession>();
  private redisAvailable = true;

  constructor(config: SessionManagerConfig) {
    this.config = {
      redisHost: config.redisHost || 'localhost',
      redisPort: config.redisPort || 6379,
      sessionTimeout: config.sessionTimeout || DEFAULT_SESSION_TIMEOUT,
    };

    this.redis = createClient({
      socket: {
        host: this.config.redisHost,
        port: this.config.redisPort,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('[SessionManager] Redis unavailable, using in-memory storage');
            this.redisAvailable = false;
            return false;
          }
          return Math.min(retries * 100, 1000);
        },
      },
    });

    this.redis.on('error', (err) => {
      console.error('[SessionManager] Redis error:', err.message);
      this.redisAvailable = false;
    });

    this.redis.on('connect', () => {
      console.log('[SessionManager] Connected to Redis');
      this.redisAvailable = true;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (err) {
      console.log('[SessionManager] Redis connection failed, using in-memory storage');
      this.redisAvailable = false;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
    console.log('[SessionManager] Disconnected from Redis');
  }

  private sessionKey(channelId: string): string {
    return `session:channel:${channelId}`;
  }

  private containerKey(channelId: string): string {
    return `container:channel:${channelId}`;
  }

  async getSession(channelId: string): Promise<ChannelSession | null> {
    // Check local cache first
    const cached = this.localCache.get(channelId);
    if (cached && cached.status === 'active') {
      // Check if session is expired
      const age = Date.now() - cached.lastActivity;
      if (age > this.config.sessionTimeout * 1000) {
        await this.deleteSession(channelId);
        return null;
      }
      cached.lastActivity = Date.now();
      await this.saveSession(cached);
      return cached;
    }

    if (!this.redisAvailable) {
      return null;
    }

    // Check Redis
    const key = this.sessionKey(channelId);
    try {
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      const session: ChannelSession = JSON.parse(data);
      
      // Check if session is expired
      const age = Date.now() - session.lastActivity;
      if (age > this.config.sessionTimeout * 1000) {
        await this.deleteSession(channelId);
        return null;
      }

      // Update local cache
      this.localCache.set(channelId, session);
      return session;
    } catch {
      return null;
    }
  }

  async createSession(params: {
    channelId: string;
    channelName: string;
    containerId: string;
    containerName: string;
    agentType: ChannelSession['agentType'];
    plugins: string[];
    workspacePath: string;
    model: string;
  }): Promise<ChannelSession> {
    const session: ChannelSession = {
      sessionId: uuidv4(),
      channelId: params.channelId,
      channelName: params.channelName,
      containerId: params.containerId,
      containerName: params.containerName,
      agentType: params.agentType,
      plugins: params.plugins,
      workspacePath: params.workspacePath,
      model: params.model,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
    };

    await this.saveSession(session);

    // Store container mapping
    if (this.redisAvailable) {
      try {
        await this.redis.set(this.containerKey(params.channelId), params.containerId);
      } catch {
        // Container mapping stored in session
      }
    }

    return session;
  }

  async updateSession(channelId: string, updates: Partial<ChannelSession>): Promise<void> {
    const session = await this.getSession(channelId);
    if (!session) {
      throw new Error(`Session not found for channel ${channelId}`);
    }

    const updated: ChannelSession = {
      ...session,
      ...updates,
      lastActivity: Date.now(),
    };

    await this.saveSession(updated);
    this.localCache.set(channelId, updated);
  }

  async deleteSession(channelId: string): Promise<void> {
    this.localCache.delete(channelId);
    
    if (this.redisAvailable) {
      try {
        const key = this.sessionKey(channelId);
        await this.redis.del(key);
        await this.redis.del(this.containerKey(channelId));
      } catch {
        // Redis delete failed
      }
    }
  }

  async updateActivity(channelId: string): Promise<void> {
    const session = await this.getSession(channelId);
    if (session) {
      session.lastActivity = Date.now();
      await this.saveSession(session);
    }
  }

  async getContainerForChannel(channelId: string): Promise<string | null> {
    // Check local cache first
    const session = this.localCache.get(channelId);
    if (session) {
      return session.containerId;
    }
    
    if (!this.redisAvailable) {
      return null;
    }

    try {
      return await this.redis.get(this.containerKey(channelId));
    } catch {
      return null;
    }
  }

  async listActiveSessions(): Promise<ChannelSession[]> {
    const sessions: ChannelSession[] = [];

    // Get from local cache
    for (const session of this.localCache.values()) {
      if (session.status === 'active') {
        const age = Date.now() - session.lastActivity;
        if (age <= this.config.sessionTimeout * 1000) {
          sessions.push(session);
        }
      }
    }

    // Also get from Redis if available
    if (this.redisAvailable) {
      try {
        const keys = await this.redis.keys(this.sessionKey('*'));
        for (const key of keys) {
          const data = await this.redis.get(key);
          if (data) {
            try {
              const session: ChannelSession = JSON.parse(data);
              if (session.status === 'active') {
                const age = Date.now() - session.lastActivity;
                if (age <= this.config.sessionTimeout * 1000) {
                  // Avoid duplicates
                  if (!sessions.find(s => s.channelId === session.channelId)) {
                    sessions.push(session);
                  }
                }
              }
            } catch {
              // Skip invalid entries
            }
          }
        }
      } catch {
        // Redis keys failed
      }
    }

    return sessions;
  }

  async cleanupExpiredSessions(): Promise<number> {
    let cleaned = 0;

    // Clean local cache
    for (const [channelId, session] of this.localCache.entries()) {
      const age = Date.now() - session.lastActivity;
      if (age > this.config.sessionTimeout * 1000) {
        this.localCache.delete(channelId);
        cleaned++;
      }
    }

    // Clean Redis if available
    if (this.redisAvailable) {
      try {
        const keys = await this.redis.keys(this.sessionKey('*'));
        for (const key of keys) {
          const data = await this.redis.get(key);
          if (data) {
            try {
              const session: ChannelSession = JSON.parse(data);
              const age = Date.now() - session.lastActivity;
              if (age > this.config.sessionTimeout * 1000) {
                await this.redis.del(key);
                await this.redis.del(this.containerKey(session.channelId));
                this.localCache.delete(session.channelId);
                cleaned++;
              }
            } catch {
              // Skip invalid entries
            }
          }
        }
      } catch {
        // Redis cleanup failed
      }
    }

    if (cleaned > 0) {
      console.log(`[SessionManager] Cleaned up ${cleaned} expired sessions`);
    }

    return cleaned;
  }

  private async saveSession(session: ChannelSession): Promise<void> {
    // Always save to local cache
    this.localCache.set(session.channelId, session);
    
    // Try to save to Redis if available
    if (this.redisAvailable) {
      try {
        const key = this.sessionKey(session.channelId);
        await this.redis.set(key, JSON.stringify(session));
      } catch (err) {
        console.log('[SessionManager] Redis save failed, session stored in-memory only');
      }
    }
  }
}
