import { business, followUp } from '../testing/fixtures.js';
import { groundMentions, missingFields } from './booking-draft.js';

describe('groundMentions', () => {
  it('keeps only mentions that appear in the message and resolve to valid values', () => {
    const mentions = groundMentions(
      'Follow-up next Tuesday around 3pm',
      [
        { text: 'follow-up', field: 'service', value: followUp.id },
        { text: 'next Tuesday', field: 'date', value: '2026-10-06' },
        { text: '3pm', field: 'time', value: '15:00' },
        { text: 'massage', field: 'service', value: followUp.id },
        { text: 'around 3pm', field: 'time', value: 'afternoon' },
      ],
      business,
    );

    expect(mentions.map(({ text }) => text)).toEqual(['follow-up', 'next Tuesday', '3pm']);
  });
});

describe('missingFields', () => {
  it('lists the fields still needed for a booking', () => {
    expect(missingFields({ date: '2026-10-06', notes: 'knee' })).toEqual(['service', 'time']);
  });
});
