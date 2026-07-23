process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import app from './src/index.js';

let server;
const PORT = 3020;
const BASE_URL = `http://localhost:${PORT}`;

beforeAll(() => {
  server = app.listen(PORT);
});

afterAll(() => {
  if (server) server.close();
});

describe('To-Do List CRUD API Endpoint Tests', () => {
  it('[TEST] GET / returns API metadata with status 200', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.name).toBe('Task API');
    expect(data.version).toBe('1.0');
    expect(Array.isArray(data.endpoints)).toBe(true);
  });

  it('[TEST] GET /health returns status ok with status 200', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('[TEST] GET /tasks returns initial array of 3 tasks', async () => {
    const res = await fetch(`${BASE_URL}/tasks`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
  });

  it('[TEST] GET /tasks/1 returns task object with status 200', async () => {
    const res = await fetch(`${BASE_URL}/tasks/1`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe(1);
  });

  it('[TEST] GET /tasks/99 returns 404 with error JSON', async () => {
    const res = await fetch(`${BASE_URL}/tasks/99`);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe('Task 99 not found');
  });

  it('[TEST] POST /tasks creates task with status 201', async () => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy milk' })
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.id).toBe(4);
    expect(data.title).toBe('Buy milk');
    expect(data.done).toBe(false);
  });

  it('[TEST] POST /tasks with invalid body returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('Title is required');
  });

  it('[TEST] PUT /tasks/4 updates task done status with 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/tasks/4`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.done).toBe(true);
  });

  it('[TEST] PUT /tasks/99 for non-existent task returns 404', async () => {
    const res = await fetch(`${BASE_URL}/tasks/99`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Non-existent' })
    });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe('Task 99 not found');
  });

  it('[TEST] DELETE /tasks/4 removes task and returns 204 No Content', async () => {
    const res = await fetch(`${BASE_URL}/tasks/4`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('[TEST] DELETE /tasks/4 again returns 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/tasks/4`, { method: 'DELETE' });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe('Task 4 not found');
  });

  it('[TEST] GET /stats returns total, done, and open metrics', async () => {
    const res = await fetch(`${BASE_URL}/stats`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.total).toBe(3);
  });

  it('[TEST] GET /docs/ serves Swagger UI HTML page with status 200', async () => {
    const res = await fetch(`${BASE_URL}/docs/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});
