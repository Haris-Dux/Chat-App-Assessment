export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletion {
  content: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

export abstract class LlmClient {
  abstract readonly model: string;

  abstract completeJson(messages: LlmMessage[]): Promise<LlmCompletion>;
}
