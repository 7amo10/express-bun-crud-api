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

// Stage 3: Create, Update, Delete Endpoints on Postgres
app.post('/tasks', async (req, res) => {
  try {
    const { title } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }

    const cleanTitle = title.trim();
    const { rows } = await query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
      [cleanTitle, false]
    );

    res.status(201).json(formatTask(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    const existingRes = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    const existing = existingRes.rows[0];
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
      if (typeof done !== 'boolean') {
        return res.status(400).json({ error: 'Done must be a boolean (true or false)' });
      }
      newDone = done;
    }

    const { rows } = await query(
      'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
      [newTitle, newDone, id]
    );

    res.status(200).json(formatTask(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    const { rows } = await query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extras: Stats & Reset on Postgres
app.get('/stats', async (req, res) => {
  try {
    const totalRes = await query('SELECT COUNT(*)::int as total FROM tasks');
    const doneRes = await query('SELECT COUNT(*)::int as done_count FROM tasks WHERE done = true');
    const total = totalRes.rows[0].total;
    const doneCount = doneRes.rows[0].done_count;
    const openCount = total - doneCount;

    res.status(200).json({ total, done: doneCount, open: openCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/reset', async (req, res) => {
  try {
    await query('TRUNCATE TABLE tasks RESTART IDENTITY');
    await query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Learn Express & Bun', true]);
    await query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Build CRUD API', false]);
    await query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Setup Swagger UI', false]);

    const { rows } = await query('SELECT * FROM tasks ORDER BY id ASC');
    res.status(200).json({ message: 'Tasks reset to initial database state', tasks: rows.map(formatTask) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
