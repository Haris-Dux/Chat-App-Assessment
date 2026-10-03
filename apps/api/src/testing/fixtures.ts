import type { Business, Service } from '@concierge/contracts';
import type { Interpretation } from '../ai/interpretation.js';

export const assessment: Service = {
  id: '12648568-6b58-4741-b2ee-fe0e40703523',
  name: 'Initial assessment',
  description: 'First visit',
  durationMinutes: 60,
};

export const followUp: Service = {
  id: 'ed0e245a-2230-4023-8d40-fb7c60bf667b',
  name: 'Follow-up session',
  description: 'Existing patients',
  durationMinutes: 30,
};

export const business: Business = {
  id: '0a802981-19c0-48c0-b702-0eab33bd1d25',
  slug: 'lumen-physio',
  name: 'Lumen Physio',
  timezone: 'Asia/Karachi',
  opensAt: '09:00',
  closesAt: '18:00',
  workingDays: [1, 2, 3, 4, 5, 6],
  services: [assessment, followUp],
};

export function interpretation(overrides: Partial<Interpretation> = {}): Interpretation {
  return {
    intent: 'book',
    booking: { serviceId: null, date: null, time: null, notes: null },
    mentions: [],
    ambiguous: false,
    reply: 'Which day suits you?',
    ...overrides,
  };
}
