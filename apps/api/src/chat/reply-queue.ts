import { Injectable } from '@nestjs/common';

@Injectable()
export class ReplyQueue {
  private readonly tails = new Map<string, Promise<void>>();

  isBusy(sessionId: string): boolean {
    return this.tails.has(sessionId);
  }

  enqueue(sessionId: string, task: () => Promise<void>): Promise<void> {
    const tail = (this.tails.get(sessionId) ?? Promise.resolve()).then(task);
    this.tails.set(sessionId, tail);

    return tail.finally(() => {
      if (this.tails.get(sessionId) === tail) {
        this.tails.delete(sessionId);
      }
    });
  }
}
