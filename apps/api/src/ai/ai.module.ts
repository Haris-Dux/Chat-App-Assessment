import { Module } from '@nestjs/common';
import { AiInteractionsRepository } from './ai-interactions.repository.js';
import { BookingInterpreter } from './booking-interpreter.js';
import { LlmClient } from './llm-client.js';
import { MistralLlmClient } from './mistral-llm.client.js';

@Module({
  providers: [
    AiInteractionsRepository,
    BookingInterpreter,
    { provide: LlmClient, useClass: MistralLlmClient },
  ],
  exports: [BookingInterpreter],
})
export class AiModule {}
