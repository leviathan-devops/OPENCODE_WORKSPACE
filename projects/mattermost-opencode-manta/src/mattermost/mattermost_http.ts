/**
 * Mattermost HTTP API Client
 * 
 * Handles HTTP API calls to Mattermost for posting messages,
 * file uploads, and channel operations.
 */

import https from 'https';
import http from 'http';

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

const MAX_POST_LENGTH = 4000;

export class MattermostHTTPClient {
  private baseUrl: string;
  private token: string;

  constructor(config: MattermostHTTPConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.token = config.token;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}/api/v4${path}`);
    
    return new Promise((resolve, reject) => {
      const protocol = url.protocol === 'https:' ? https : http;
      
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: this.getHeaders(),
        timeout: 30000,
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            console.error(`[MattermostHTTP] ${method} ${path} → ${res.statusCode}: ${data}`);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }

          if (res.statusCode === 204) {
            resolve({ success: true });
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async getMe(): Promise<any> {
    return this.request('GET', '/users/me');
  }

  async getChannel(channelId: string): Promise<ChannelInfo> {
    return this.request('GET', `/channels/${channelId}`);
  }

  async getChannelPosts(channelId: string, since?: number): Promise<{ posts: Record<string, any>; order: string[] }> {
    let path = `/channels/${channelId}/posts`;
    if (since) {
      path += `?since=${since}`;
    }
    return this.request('GET', path);
  }

  async createPost(
    channelId: string,
    message: string,
    rootId?: string,
    fileIds?: string[]
  ): Promise<PostResponse> {
    const body: any = {
      channel_id: channelId,
      message: this.truncateMessage(message),
    };

    if (rootId) {
      body.root_id = rootId;
    }

    if (fileIds && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    return this.request('POST', '/posts', body);
  }

  async createPostWithFile(
    channelId: string,
    message: string,
    fileData: Buffer,
    fileName: string,
    rootId?: string
  ): Promise<PostResponse> {
    const fileId = await this.uploadFile(channelId, fileData, fileName);
    
    if (!fileId) {
      throw new Error('File upload failed');
    }

    return this.createPost(channelId, message, rootId, [fileId]);
  }

  async uploadFile(
    channelId: string,
    fileData: Buffer,
    fileName: string
  ): Promise<string | null> {
    const boundary = `----MattermostBoundary${Date.now()}`;
    
    const bodyParts: Buffer[] = [];
    
    bodyParts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="channel_id"\r\n\r\n` +
      `${channelId}\r\n`
    ));

    bodyParts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    ));

    bodyParts.push(fileData);
    bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(bodyParts);

    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/api/v4/files`);
      const protocol = url.protocol === 'https:' ? https : http;

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length.toString(),
        },
        timeout: 60000,
      };

      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            console.error(`[MattermostHTTP] upload → ${res.statusCode}: ${data}`);
            resolve(null);
            return;
          }

          try {
            const response = JSON.parse(data);
            const fileInfos = response.file_infos;
            if (fileInfos && fileInfos.length > 0) {
              resolve(fileInfos[0].id);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Upload timeout'));
      });

      req.write(body);
      req.end();
    });
  }

  async sendTyping(channelId: string, userId: string): Promise<void> {
    try {
      await this.request('POST', `/users/${userId}/typing`, {
        channel_id: channelId,
      });
    } catch (error) {
      // Ignore typing indicator errors
    }
  }

  async listTeams(): Promise<any[]> {
    return this.request('GET', '/users/me/teams');
  }

  async listChannels(teamId: string): Promise<ChannelInfo[]> {
    return this.request('GET', `/teams/${teamId}/channels`);
  }

  private truncateMessage(message: string): string {
    if (message.length <= MAX_POST_LENGTH) {
      return message;
    }
    return message.substring(0, MAX_POST_LENGTH - 3) + '...';
  }
}
