import app from './src/index.js';

let server;
const PORT = 3020;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('=== Starting API Endpoint Tests ===\n');
  server = app.listen(PORT);

  try {
    // 1. GET /
    console.log('[TEST] GET / ...');
    let res = await fetch(`${BASE_URL}/`);
    let data = await res.json();
    console.assert(res.status === 200, `Expected 200, got ${res.status}`);
    console.assert(data.name === 'Task API', 'Name mismatch');
    console.log('[OK] GET / passed\n');

    // 2. GET /health
    console.log('[TEST] GET /health ...');
    res = await fetch(`${BASE_URL}/health`);
    data = await res.json();
    console.assert(res.status === 200, `Expected 200, got ${res.status}`);
    console.assert(data.status === 'ok', 'Health status mismatch');
    console.log('[OK] GET /health passed\n');

    // 3. GET /tasks
    console.log('[TEST] GET /tasks ...');
    res = await fetch(`${BASE_URL}/tasks`);
    data = await res.json();
    console.assert(res.status === 200, `Expected 200, got ${res.status}`);
    console.assert(Array.isArray(data) && data.length === 3, 'Initial task count mismatch');
    console.log('[OK] GET /tasks passed\n');

    // 4. GET /tasks/:id (valid)
    console.log('[TEST] GET /tasks/1 ...');
    res = await fetch(`${BASE_URL}/tasks/1`);
    data = await res.json();
    console.assert(res.status === 200, `Expected 200, got ${res.status}`);
    console.assert(data.id === 1, 'Task ID mismatch');
    console.log('[OK] GET /tasks/1 passed\n');

    // 5. GET /tasks/:id (404)
    console.log('[TEST] GET /tasks/99 (404) ...');
    res = await fetch(`${BASE_URL}/tasks/99`);
    data = await res.json();
    console.assert(res.status === 404, `Expected 404, got ${res.status}`);
    console.assert(data.error === 'Task 99 not found', '404 error message mismatch');
    console.log('[OK] GET /tasks/99 404 passed\n');

    // 6. POST /tasks (201 Created)
    console.log('[TEST] POST /tasks (201 Created) ...');
    res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy milk' })
    });
    data = await res.json();
    console.assert(res.status === 201, `Expected 201, got ${res.status}`);
    console.assert(data.id === 4 && data.title === 'Buy milk' && data.done === false, 'Created task payload mismatch');
    console.log('[OK] POST /tasks 201 passed\n');

    // 7. POST /tasks (400 Bad Request - empty title)
    console.log('[TEST] POST /tasks (400 Bad Request) ...');
    res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    data = await res.json();
    console.assert(res.status === 400, `Expected 400, got ${res.status}`);
    console.assert(data.error.includes('Title is required'), 'Validation error message mismatch');
    console.log('[OK] POST /tasks 400 passed\n');

    // 8. PUT /tasks/:id (200 OK update task)
    console.log('[TEST] PUT /tasks/4 (200 OK update) ...');
    res = await fetch(`${BASE_URL}/tasks/4`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true })
    });
    data = await res.json();
    console.assert(res.status === 200, `Expected 200, got ${res.status}`);
    console.assert(data.done === true, 'Updated done status mismatch');
    console.log('[OK] PUT /tasks/4 passed\n');

    // 9. PUT /tasks/:id (404 Not Found)
    console.log('[TEST] PUT /tasks/99 (404) ...');
    res = await fetch(`${BASE_URL}/tasks/99`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Non-existent task' })
    });
    data = await res.json();
    console.assert(res.status === 404, `Expected 404, got ${res.status}`);
    console.log('[OK] PUT /tasks/99 404 passed\n');

    // 10. DELETE /tasks/:id (204 No Content)
    console.log('[TEST] DELETE /tasks/4 (204 No Content) ...');
    res = await fetch(`${BASE_URL}/tasks/4`, { method: 'DELETE' });
    console.assert(res.status === 204, `Expected 204, got ${res.status}`);
    console.log('[OK] DELETE /tasks/4 204 passed\n');

    // 11. DELETE /tasks/:id (404 Not Found)
    console.log('[TEST] DELETE /tasks/4 again (404 Not Found) ...');
    res = await fetch(`${BASE_URL}/tasks/4`, { method: 'DELETE' });
    data = await res.json();
    console.assert(res.status === 404, `Expected 404, got ${res.status}`);
    console.log('[OK] DELETE /tasks/4 404 passed\n');

    // 12. GET /stats
    console.log('[TEST] GET /stats ...');
    res = await fetch(`${BASE_URL}/stats`);
    data = await res.json();
    console.assert(res.status === 200, `Expected 200, got ${res.status}`);
    console.assert(data.total === 3, 'Stats count mismatch');
    console.log('[OK] GET /stats passed\n');

    // 13. GET /docs
    console.log('[TEST] GET /docs/ ...');
    res = await fetch(`${BASE_URL}/docs/`);
    console.assert(res.status === 200, `Expected 200, got ${res.status}`);
    console.log('[OK] GET /docs/ passed\n');

    console.log('=== ALL ENDPOINT TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('[FAIL] Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
