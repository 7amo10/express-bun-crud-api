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
    endpoints: ['/tasks']
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Stage 2: Read Endpoints
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
