import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";

let db: DatabaseType | null = null;

function getDb(): DatabaseType {
  if (!db) {
    const dbPath = path.join(process.cwd(), "cache.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    db.exec(`
      CREATE TABLE IF NOT EXISTS url_cache (
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (url, type)
      )
    `);
  }
  return db;
}

export function getCache<T>(url: string, type: string): T | null {
  const row = getDb()
    .prepare("SELECT result FROM url_cache WHERE url = ? AND type = ?")
    .get(url, type) as { result: string } | undefined;

  if (row) {
    console.log(`[Cache] HIT: ${type} für ${url}`);
    return JSON.parse(row.result) as T;
  }

  console.log(`[Cache] MISS: ${type} für ${url}`);
  return null;
}

export function setCache(url: string, type: string, result: unknown): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO url_cache (url, type, result, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(url, type, JSON.stringify(result), new Date().toISOString());

  console.log(`[Cache] SAVED: ${type} für ${url}`);
}
