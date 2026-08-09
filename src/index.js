import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import pool, { query, initDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 3020;

const swaggerDocument = JSON.parse(
  readFileSync(new URL('./openapi.json', import.meta.url), 'utf-8')
);

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Helper: Format database task row (convert done to boolean)
const formatTask = (row) => ({
  id: row.id,
  title: row.title,
  done: Boolean(row.done)
});

// Stage 1: Root and Health Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks', '/stats', '/docs']
  });
});

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

// Stage 2: Read Endpoints from Postgres
app.get('/tasks', async (req, res) => {
  try {
    let sql = 'SELECT * FROM tasks';
    const params = [];
    const conditions = [];

    if (req.query.done !== undefined) {
      params.push(req.query.done === 'true');
      conditions.push(`done = $${params.length}`);
    }

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id ASC';

    const { rows } = await query(sql, params);
    res.status(200).json(rows.map(formatTask));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    const { rows } = await query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    res.status(200).json(formatTask(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stage 2: Create Endpoint with Database Insert
app.post('/tasks', (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }

  const cleanTitle = title.trim();
  const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const info = insertStmt.run(cleanTitle, 0);

  const newTask = {
    id: Number(info.lastInsertRowid),
    title: cleanTitle,
    done: false
  };

  res.status(201).json(newTask);
});

// Stage 3: Update & Delete Endpoints with SQL
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const { title, done } = req.body || {};

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'Provide title and/or done to update task' });
  }

  let newTitle = existing.title;
  let newDone = existing.done;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    newTitle = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean' && done !== 0 && done !== 1) {
      return res.status(400).json({ error: 'Done must be a boolean (true or false)' });
    }
    newDone = done ? 1 : 0;
  }

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
  const updatedRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  res.status(200).json(formatTask(updatedRow));
});

app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  res.status(204).send();
});

// Extras: Database Stats & Database Reset
app.get('/stats', (req, res) => {
  const { total } = db.prepare('SELECT COUNT(*) as total FROM tasks').get();
  const { doneCount } = db.prepare('SELECT COUNT(*) as doneCount FROM tasks WHERE done = 1').get();
  const openCount = total - doneCount;

  res.status(200).json({ total, done: doneCount, open: openCount });
});

app.post('/reset', (req, res) => {
  db.exec('DELETE FROM tasks;');
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name='tasks';");
  } catch (e) {}

  const insertStmt = db.prepare('INSERT INTO tasks (id, title, done) VALUES (?, ?, ?)');
  
  const resetTransaction = db.transaction(() => {
    insertStmt.run(1, 'Learn Express & Bun', 1);
    insertStmt.run(2, 'Build CRUD API', 0);
    insertStmt.run(3, 'Setup Swagger UI', 0);
  });

  resetTransaction();
  const rows = db.prepare('SELECT * FROM tasks').all();
  res.status(200).json({ message: 'Tasks reset to initial database state', tasks: rows.map(formatTask) });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
