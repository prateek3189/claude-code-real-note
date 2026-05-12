import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Database } from 'bun:sqlite';

const dbPath = process.env.DB_PATH ?? 'data/app.db';
mkdirSync(dirname(dbPath), { recursive: true });

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    db = new Database(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    initTables(db);
  }
  return db;
}

function initTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL,
      title        TEXT NOT NULL,
      content_json TEXT NOT NULL,
      is_public    INTEGER NOT NULL DEFAULT 0,
      public_slug  TEXT UNIQUE,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_user_id     ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_public_slug ON notes(public_slug);
    CREATE INDEX IF NOT EXISTS idx_notes_is_public   ON notes(is_public);
  `);
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  return getDb()
    .query<T, unknown[]>(sql)
    .all(...params);
}

export function get<T>(sql: string, params: unknown[] = []): T | undefined {
  return (
    getDb()
      .query<T, unknown[]>(sql)
      .get(...params) ?? undefined
  );
}

export function run(sql: string, params: unknown[] = []): void {
  getDb()
    .query(sql)
    .run(...params);
}
