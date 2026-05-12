import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { Database } from 'bun:sqlite';

const dbPath = process.env.DB_PATH ?? 'data/app.db';
mkdirSync(dirname(dbPath), { recursive: true });

export const auth = betterAuth({
  database: new Database(dbPath),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});
