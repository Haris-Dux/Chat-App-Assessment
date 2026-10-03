import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AiInteractionsRepository, type NewAiInteraction } from './ai-interactions.repository.js';
import { buildBookingPrompt } from './booking-prompt.js';
import {
  interpretationSchema,
  type Interpretation,
  type InterpretationContext,
} from './interpretation.js';
import { LlmClient } from './llm-client.js';

@Injectable()
export class BookingInterpreter {
  private readonly logger = new Logger(BookingInterpreter.name);

  constructor(
    private readonly llm: LlmClient,
    private readonly interactions: AiInteractionsRepository,
  ) {}

  async interpret(context: InterpretationContext): Promise<Interpretation | null> {
    const messages = buildBookingPrompt(context);
    const startedAt = performance.now();
    const interaction = {
      businessId: context.business.id,
      sessionId: context.sessionId,
      model: this.llm.model,
      request: messages,
    };

    try {
      const completion = await this.llm.completeJson(messages);
      const parsed = interpretationSchema.safeParse(parseJson(completion.content));

      await this.record({
        ...interaction,
        latencyMs: elapsedSince(startedAt),
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        ...(parsed.success
          ? { status: 'ok', response: parsed.data }
          : {
              status: 'invalid_output',
              response: { raw: completion.content },
              error: z.prettifyError(parsed.error),
            }),
      });

      return parsed.success ? parsed.data : null;
    } catch (error) {
      await this.record({
        ...interaction,
        latencyMs: elapsedSince(startedAt),
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async record(interaction: NewAiInteraction): Promise<void> {
    const summary = {
      sessionId: interaction.sessionId,
      model: interaction.model,
      status: interaction.status,
      latencyMs: interaction.latencyMs,
      error: interaction.error,
    };

    if (interaction.status === 'ok') {
      this.logger.log(summary, 'AI interaction');
    } else {
      this.logger.warn(summary, 'AI interaction failed');
    }

    try {
      await this.interactions.record(interaction);
    } catch (error) {
      this.logger.error(error, 'Could not store AI interaction');
    }
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function elapsedSince(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}
