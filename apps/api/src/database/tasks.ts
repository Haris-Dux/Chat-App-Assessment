import { readFile } from 'node:fs/promises';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const [task] = process.argv.slice(2);
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set');
}

const db = drizzle(url);

try {
  if (task === 'migrate') {
    await migrate(db, { migrationsFolder: 'database/migrations' });
  } else if (task === 'seed') {
    await db.$client.query(await readFile('database/seed.sql', 'utf8'));
  } else {
    throw new Error(`Unknown task "${task}", expected "migrate" or "seed"`);
  }
} finally {
  await db.$client.end();
}
