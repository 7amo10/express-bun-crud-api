import { Database } from 'bun:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'tasks.db');

const db = new Database(dbPath);

db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  );
`);

const countStmt = db.prepare('SELECT COUNT(*) as count FROM tasks');
const { count } = countStmt.get();

if (count === 0) {
  const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  
  const seedTransaction = db.transaction(() => {
    insertStmt.run('Learn Express & Bun', 1);
    insertStmt.run('Build CRUD API', 0);
    insertStmt.run('Setup Swagger UI', 0);
  });

  seedTransaction();
  console.log('[DB] Database initialized and seeded with 3 example tasks.');
} else {
  console.log(`[DB] Database connected. Found ${count} existing task(s).`);
}

export default db;
