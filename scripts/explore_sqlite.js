import { Database } from 'bun:sqlite';
import { join } from 'path';

const dbPath = join(import.meta.dir, '..', 'tasks.db');
const db = new Database(dbPath);

console.log('=== Stage 4: Exploring SQLite Queries by Hand ===\n');

// 1. SELECT * FROM tasks;
console.log('1. Query: SELECT * FROM tasks;');
console.log(db.query('SELECT * FROM tasks;').all());
console.log('');

// 2. SELECT * FROM tasks WHERE done = 1;
console.log('2. Query: SELECT * FROM tasks WHERE done = 1;');
console.log(db.query('SELECT * FROM tasks WHERE done = 1;').all());
console.log('');

// 3. SELECT COUNT(*) as count FROM tasks;
console.log('3. Query: SELECT COUNT(*) as count FROM tasks;');
console.log(db.query('SELECT COUNT(*) as count FROM tasks;').get());
console.log('');

// 4. UPDATE tasks SET done = 1 WHERE id = 2;
console.log('4. Query: UPDATE tasks SET done = 1 WHERE id = 2;');
db.query('UPDATE tasks SET done = 1 WHERE id = 2;').run();
console.log('Updated Task 2 done status to 1.');
console.log('');

// 5. Verify updated state via API query
console.log('5. Query after update: SELECT * FROM tasks WHERE id = 2;');
console.log(db.query('SELECT * FROM tasks WHERE id = 2;').get());
console.log('');

console.log('=== Exploration Complete ===');
