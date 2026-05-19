import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/server/db/schema/index.ts',
  out: './migrations/_drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
