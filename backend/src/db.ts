/**
 * SQLite access via Node's built-in node:sqlite (no native build step).
 * DB file: STUDYFLOW_DB or backend/data/studyflow.db (git-ignored).
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SEED_SUBJECTS, SEED_TASKS, SEED_USERS, SEED_VERSION } from "./seed.js";

const DB_PATH = process.env.STUDYFLOW_DB ?? path.resolve(import.meta.dirname, "..", "data", "studyflow.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subjects (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date    TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('todo', 'done')),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

/** Wipe all data and restore the deterministic seed. Used at startup (empty DB) and by the harness. */
export function resetDatabase(): void {
  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM tasks; DELETE FROM subjects; DELETE FROM users; DELETE FROM meta;");
    const u = db.prepare("INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)");
    for (const r of SEED_USERS) u.run(r.id, r.email, r.name, r.passwordHash);
    const s = db.prepare("INSERT INTO subjects (id, user_id, name, created_at) VALUES (?, ?, ?, ?)");
    for (const r of SEED_SUBJECTS) s.run(r.id, r.userId, r.name, r.createdAt);
    const t = db.prepare(
      `INSERT INTO tasks (id, user_id, subject_id, title, description, due_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const r of SEED_TASKS) {
      t.run(r.id, r.userId, r.subjectId, r.title, r.description, r.dueDate, r.status, r.createdAt, r.createdAt);
    }
    db.prepare("INSERT INTO meta (key, value) VALUES ('seed_version', ?)").run(SEED_VERSION);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

const row = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number } | undefined;
if (!row || row.n === 0) resetDatabase();
