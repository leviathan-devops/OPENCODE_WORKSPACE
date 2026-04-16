import axios from 'axios';
import { BrainExecutionOptions, BrainResponse, BrainType, TokenUsage } from './types.js';

export class GemmaClient {
  private apiKey: string | null;
  private model: string;

  constructor(config?: any) {
    this.apiKey = config?.apiKey || process.env.GOOGLE_API_KEY || null;
    this.model = config?.model || 'gemma-3-4b-it';
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async execute(prompt: string, options?: BrainExecutionOptions): Promise<BrainResponse> {
    throw new Error('Gemma API not configured. Set GOOGLE_API_KEY or ensure vLLM is available.');
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }
}

export default GemmaClient;
