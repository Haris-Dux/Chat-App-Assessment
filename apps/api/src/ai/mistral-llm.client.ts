import { Mistral } from '@mistralai/mistralai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { LlmClient, type LlmCompletion, type LlmMessage } from './llm-client.js';

@Injectable()
export class MistralLlmClient extends LlmClient {
  readonly model: string;
  private readonly apiKey: string;
  private readonly client: Mistral;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.model = config.get('MISTRAL_MODEL', { infer: true });
    this.apiKey = config.get('MISTRAL_API_KEY', { infer: true });
    this.client = new Mistral({
      apiKey: this.apiKey,
      timeoutMs: config.get('MISTRAL_TIMEOUT_MS', { infer: true }),
    });
  }

  async completeJson(messages: LlmMessage[]): Promise<LlmCompletion> {
    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY is not configured');
    }

    const response = await this.client.chat.complete({
      model: this.model,
      messages,
      temperature: 0.2,
      responseFormat: { type: 'json_object' },
    });
    const content = response.choices[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error('Mistral returned a completion without text content');
    }

    return {
      content,
      promptTokens: response.usage.promptTokens ?? null,
      completionTokens: response.usage.completionTokens ?? null,
    };
  }
}
