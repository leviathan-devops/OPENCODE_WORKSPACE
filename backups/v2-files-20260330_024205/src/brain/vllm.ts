/**
 * 🦈 SHARK CLI - vLLM Client (Qwen 2.5 Coder)
 *
 * Minimal OpenAI-compatible client for local vLLM server.
 * PRIMARY execution brain for Micro Engineer mode.
 *
 * Configuration:
 * - Default: http://localhost:8000/v1 (OpenAI-compatible)
 * - Model: Auto-detected from server
 * - Fallback: Gemma 3 4B (if vLLM unavailable)
 */

import axios, { AxiosInstance } from 'axios';
import { BrainResponse, BrainType, TokenUsage, ToolCall, BrainClient, BrainExecutionOptions } from './types';
import { REASONING_CHAIN_SYSTEM_PROMPT } from './reasoning-validator';

export interface VLLMClientConfig {
  baseUrl?: string;
  timeout?: number;
  model?: string;
}

/**
 * vLLM client using OpenAI-compatible API
 */
export class VLLMClient {
  private client: AxiosInstance;
  private model: string | null = null;
  private configured: boolean = false;

  constructor(config: VLLMClientConfig = {}) {
    const baseUrl = config.baseUrl || process.env.VLLM_API_URL || 'http://localhost:8000/v1';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: config.timeout || 300000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Check server availability synchronously
    this.checkServer();
  }

  private async checkServer(): Promise<void> {
    try {
      const response = await this.client.get('/models', { timeout: 2000 });
      if (response.data?.data?.length > 0) {
        this.model = response.data.data[0].id;
        this.configured = true;
      }
    } catch (error) {
      this.configured = false;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async execute(prompt: string, options?: { context?: string; maxTokens?: number; temperature?: number }): Promise<BrainResponse> {
    if (!this.configured) {
      throw new Error('vLLM server not available');
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (options?.context) {
      messages.push({ role: 'system', content: options.context });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.post('/chat/completions', {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    });

    const choice = response.data.choices[0];
    const usage = response.data.usage;

    return {
      content: choice.message.content,
      hasCodeChanges: this.detectCodeChanges(choice.message.content),
      tokensUsed: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      sourceBrain: BrainType.EXECUTION,
    };
  }

  private detectCodeChanges(content: string): boolean {
    return /```[\s\S]*?```|\bfunction\s+\w+|\bclass\s+\w+|\bimport\s+|\bexport\s+/.test(content);
  }
}

export default VLLMClient;
