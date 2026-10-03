import { Logger } from '@nestjs/common';
import { business } from '../testing/fixtures.js';
import type { AiInteractionsRepository } from './ai-interactions.repository.js';
import { BookingInterpreter } from './booking-interpreter.js';
import type { LlmClient } from './llm-client.js';

describe('BookingInterpreter', () => {
  const llm = { model: 'test-model', completeJson: vi.fn() };
  const interactions = { record: vi.fn() };
  const interpreter = new BookingInterpreter(
    llm as unknown as LlmClient,
    interactions as unknown as AiInteractionsRepository,
  );
  const context = {
    sessionId: 'b46f9931-dc34-41bb-8ee0-b7005d613c2f',
    business,
    draft: {},
    history: [{ role: 'user' as const, content: 'Book a follow-up tomorrow at 10' }],
  };

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the parsed interpretation and records a successful call', async () => {
    llm.completeJson.mockResolvedValue({
      content: JSON.stringify({
        intent: 'book',
        booking: {
          serviceId: business.services[1].id,
          date: '2026-10-06',
          time: '10:00 am',
          notes: null,
        },
        mentions: [],
        ambiguous: false,
        reply: 'Great, let me check that.',
      }),
      promptTokens: 120,
      completionTokens: 40,
    });

    const result = await interpreter.interpret(context);

    expect(result?.booking).toEqual({
      serviceId: business.services[1].id,
      date: '2026-10-06',
      time: null,
      notes: null,
    });
    expect(interactions.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok', model: 'test-model', promptTokens: 120 }),
    );
  });

  it('sends the conversation after the system instructions', async () => {
    llm.completeJson.mockRejectedValue(new Error('offline'));

    await interpreter.interpret(context);

    const [messages] = llm.completeJson.mock.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain(business.services[0].id);
    expect(messages.slice(1)).toEqual(context.history);
  });

  it('returns null and records invalid output when the model breaks the contract', async () => {
    llm.completeJson.mockResolvedValue({
      content: 'not json',
      promptTokens: 1,
      completionTokens: 1,
    });

    expect(await interpreter.interpret(context)).toBeNull();
    expect(interactions.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'invalid_output', response: { raw: 'not json' } }),
    );
  });

  it('returns null and records the error when the provider fails', async () => {
    llm.completeJson.mockRejectedValue(new Error('timeout'));

    expect(await interpreter.interpret(context)).toBeNull();
    expect(interactions.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', error: 'timeout' }),
    );
  });

  it('still returns the interpretation when storing the log fails', async () => {
    llm.completeJson.mockResolvedValue({
      content: JSON.stringify({
        intent: 'other',
        booking: { serviceId: null, date: null, time: null, notes: null },
        reply: 'Hello!',
      }),
      promptTokens: null,
      completionTokens: null,
    });
    interactions.record.mockRejectedValue(new Error('db down'));

    expect((await interpreter.interpret(context))?.reply).toBe('Hello!');
  });
});
