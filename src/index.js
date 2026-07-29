import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3020;

const swaggerDocument = JSON.parse(
  readFileSync(new URL('./openapi.json', import.meta.url), 'utf-8')
);

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In-memory data store
let tasks = [
  { id: 1, title: 'Learn Express & Bun', done: true },
  { id: 2, title: 'Build CRUD API', done: false },
  { id: 3, title: 'Setup Swagger UI', done: false }
];

let nextId = 4;

// Stage 1: Root and Health Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks', '/stats', '/docs']
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Helper: Format database task row (convert done 1/0 to boolean)
const formatTask = (row) => ({
  id: row.id,
  title: row.title,
  done: Boolean(row.done)
});

// Stage 1: Database Read Endpoints
app.get('/tasks', (req, res) => {
  let query = 'SELECT * FROM tasks';
  const params = [];
  const conditions = [];

  if (req.query.done !== undefined) {
    conditions.push('done = ?');
    params.push(req.query.done === 'true' ? 1 : 0);
  }

  if (req.query.search) {
    conditions.push('title LIKE ?');
    params.push(`%${req.query.search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const rows = db.prepare(query).all(...params);
  res.status(200).json(rows.map(formatTask));
});

app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!row) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  res.status(200).json(formatTask(row));
});

// Stage 3: Create Endpoint with Validation
app.post('/tasks', (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    done: false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Stage 4: Update & Delete Endpoints
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const { title, done } = req.body || {};

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'Provide title and/or done to update task' });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    tasks[taskIndex].title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'Done must be a boolean (true or false)' });
    }
    tasks[taskIndex].done = done;
  }

  res.status(200).json(tasks[taskIndex]);
});

app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

// Extras: Stats & Reset
app.get('/stats', (req, res) => {
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const openCount = total - doneCount;

  res.status(200).json({ total, done: doneCount, open: openCount });
});

app.post('/reset', (req, res) => {
  tasks = [
    { id: 1, title: 'Learn Express & Bun', done: true },
    { id: 2, title: 'Build CRUD API', done: false },
    { id: 3, title: 'Setup Swagger UI', done: false }
  ];
  nextId = 4;
  res.status(200).json({ message: 'Tasks reset to initial state', tasks });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
