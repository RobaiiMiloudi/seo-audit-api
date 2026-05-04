import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'audits.db');
export const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_results (
    id          TEXT PRIMARY KEY,
    url         TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    result      TEXT,
    error       TEXT,
    created_at  INTEGER DEFAULT (unixepoch()),
    updated_at  INTEGER DEFAULT (unixepoch())
  )
`);
