import express from 'express';

const app = express();
const PORT = process.env.PORT || 3020;

app.use(express.json());

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

// Stage 2: Read Endpoints (with query parameters filtering & search)
app.get('/tasks', (req, res) => {
  let result = [...tasks];

  if (req.query.done !== undefined) {
    const isDone = req.query.done === 'true';
    result = result.filter((t) => t.done === isDone);
  }

  if (req.query.search) {
    const term = req.query.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(term));
  }

  res.status(200).json(result);
});

app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  res.status(200).json(task);
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
