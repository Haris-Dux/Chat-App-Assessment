import type { ThreadMessage } from './types';

export interface SlotChoice {
  serviceId: string;
  date: string;
  time: string;
}

export interface ThreadActions {
  pickSlot?: (slot: SlotChoice) => void;
  openTicket?: () => void;
  retry?: (message: ThreadMessage) => void;
}
