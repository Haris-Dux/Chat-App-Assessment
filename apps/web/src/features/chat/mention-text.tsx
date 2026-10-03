import type { Mention } from '@concierge/contracts';
import { motion } from 'motion/react';
import { formatDate } from '../../lib/datetime';
import { findService, useBusiness } from '../business/business-context';

type Segment = string | { mention: Mention; text: string };

function splitByMentions(content: string, mentions: Mention[]): Segment[] {
  const lower = content.toLowerCase();
  const located = mentions
    .map((mention) => ({ mention, start: lower.indexOf(mention.text.toLowerCase()) }))
    .filter(({ start }) => start >= 0)
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { mention, start } of located) {
    if (start < cursor) continue;
    const end = start + mention.text.length;
    segments.push(content.slice(cursor, start), { mention, text: content.slice(start, end) });
    cursor = end;
  }

  segments.push(content.slice(cursor));
  return segments.filter((segment) => segment !== '');
}

export function MentionText({ content, mentions }: { content: string; mentions: Mention[] }) {
  const business = useBusiness();

  const describe = ({ field, value }: Mention) => {
    if (field === 'service') return findService(business, value)?.name ?? value;
    if (field === 'date') return formatDate(value);
    return value;
  };

  return (
    <p className="whitespace-pre-wrap">
      {splitByMentions(content, mentions).map((segment, index) =>
        typeof segment === 'string' ? (
          segment
        ) : (
          <mark key={index} className="bg-transparent text-inherit">
            <motion.span
              initial={{ backgroundSize: '0% 2px' }}
              animate={{ backgroundSize: '100% 2px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-gradient-to-r from-accent to-accent bg-bottom bg-no-repeat pb-0.5"
            >
              {segment.text}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              className="ml-1.5 inline-block rounded-md bg-accent-soft px-1.5 py-1 align-middle font-mono text-[10px] font-medium not-italic leading-none text-accent"
            >
              {describe(segment.mention)}
            </motion.span>
          </mark>
        ),
      )}
    </p>
  );
}
