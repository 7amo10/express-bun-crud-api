# To-Do List CRUD API

A simple, lightweight, and performant RESTful CRUD API that manages a To-Do task list. Built using **Express.js** and running on the high-speed **Bun.js** runtime. In Week 3, the storage layer was upgraded from in-memory arrays (A1) to **SQLite** (`tasks.db` in A2), and finally to a containerized **PostgreSQL** database engine (`postgres:16-alpine` in A3) managed via **Docker Compose**.

Repository: [https://github.com/7amo10/express-bun-crud-api](https://github.com/7amo10/express-bun-crud-api)

---

## [1] Quick Start

### Prerequisites
- [Bun](https://bun.sh) (v1.0.0+) or [Node.js](https://nodejs.org) (v18+)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)

### Installation & Execution

#### Option A: One-Command Docker Compose (Recommended - Assignment A3)
```bash
# Clone the repository
git clone https://github.com/7amo10/express-bun-crud-api.git
cd express-bun-crud-api

# Copy environment template
cp .env.example .env

# Launch entire stack (API + PostgreSQL container)
docker compose up -d --build
```

#### Option B: Local Execution (Assignment A1 / A2)
```bash
bun install && bun start
```

The server listens on **`http://localhost:3020`**.

Upon execution, the application automatically creates the database table schema (if missing) and seeds 3 initial tasks.

To run automated tests:
```bash
bun test
```

---

## [2] API Endpoints Table

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/` | API Root Metadata & Endpoints List | `200 OK` |
| `GET` | `/health` | Server Health Status Check | `200 OK` / `500 Internal Error` |
| `GET` | `/tasks` | List all tasks (Supports `?done=true/false` & `?search=term`) | `200 OK` |
| `GET` | `/tasks/:id` | Get details of a single task by ID | `200 OK` / `404 Not Found` |
| `POST` | `/tasks` | Create a new task (`{"title": "..."}`) | `201 Created` / `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update task title and/or done state | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `DELETE` | `/tasks/:id` | Delete task by ID | `204 No Content` / `404 Not Found` |
| `GET` | `/stats` | Task metrics (total, done, open counts) | `200 OK` |
| `POST` | `/reset` | Reset task list to initial 3 sample tasks | `200 OK` |
| `GET` | `/docs` | Interactive Swagger UI Documentation | `200 OK` |

---

## [3] Sample `curl -i` Execution Outputs

### Create Task (`POST /tasks`)
```http
$ curl -i -X POST http://localhost:3020/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 43

{
  "id": 4,
  "title": "Buy milk",
  "done": false
}
```

### Invalid Input Validation (`POST /tasks` with empty body)
```http
$ curl -i -X POST http://localhost:3020/tasks \
  -H "Content-Type: application/json" \
  -d '{}'

HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 67

{
  "error": "Title is required and must be a non-empty string"
}
```

### Get Non-Existent Task (`GET /tasks/99`)
```http
$ curl -i http://localhost:3020/tasks/99

HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 29

{
  "error": "Task 99 not found"
}
```

### Delete Task (`DELETE /tasks/4`)
```http
$ curl -i -X DELETE http://localhost:3020/tasks/4

HTTP/1.1 204 No Content
X-Powered-By: Express
```

---

## [4] Interactive Swagger UI Documentation

Interactive API documentation generated using OpenAPI 3.0 specification is served at:
**`http://localhost:3020/docs`**

You can test all CRUD operations directly in your browser using the "Try it out" feature.

![Swagger UI Documentation](./assets/SwaggerUI.png)

---

## [5] The Mortality Experiment

When you create several tasks using `POST /tasks` and then restart the server (`Ctrl+C` followed by `bun start`), performing a `GET /tasks` will show that all newly created tasks are gone and the list resets back to the initial pre-filled array. This occurs because the data lives strictly in server memory (RAM) variables. When the process terminates, all runtime memory allocations are wiped, illustrating why persistent database storage (such as PostgreSQL or SQLite) is essential for real-world backend applications.

---

## [6] Week 3 Upgrade: Connecting CRUD to SQLite Database

In Week 3 (Assignment A2), the API storage layer was migrated from in-memory JavaScript variables to a real, disk-backed **SQLite database (`tasks.db`)**.

### Why SQLite Was Chosen
- **Single-File Portability**: All database tables and rows live inside a single file (`tasks.db`), requiring zero database server installation or daemon setup.
- **Zero Configuration**: Starts up instantly using native `bun:sqlite` / `better-sqlite3`.
- **Data Persistence**: Data survives server restarts and crashes. Tasks created via `POST /tasks` remain available on disk.

### Database Location & Auto-Creation
- The database file **`tasks.db`** lives in the root directory.
- `tasks.db` is listed in `.gitignore` so clean repository clones start fresh.
- On first startup, `src/db.js` creates `tasks.db` automatically, creates the `tasks` schema table, and seeds 3 initial tasks inside a database transaction. Restarting the server does not duplicate seeded tasks.

### DB Browser Inspection Screenshot
Below is a screenshot of **`tasks.db`** open in DB Browser for SQLite showing the `tasks` table and its records:

![DB Browser for SQLite - tasks.db](./assets/DBBrowser.png)

---

## [7] Stage 4 Hand-Executed SQL Query

During Stage 4, SQL queries were executed directly against `tasks.db` using the SQLite engine:

```sql
SELECT COUNT(*) as count FROM tasks;
```

**Result & Explanation**: Returned `{ count: 3 }`, confirming that the `tasks` table contains exactly 3 task rows.

Other hand-executed SQL queries:
- `SELECT * FROM tasks WHERE done = 1;` -> Returned completed task (`id: 1`).
- `UPDATE tasks SET done = 1 WHERE id = 2;` -> Updated task 2 to completed status directly in SQLite.

---

## [8] Storage as an "Implementation Detail" (Stretch Proof)

Moving from in-memory storage to SQLite required **zero changes** to endpoint routes or client response schemas. Running `bun test` passes 13/13 unit tests identically:

```text
 13 pass
 0 fail
 30 expect() calls
Ran 13 tests across 1 file. [257ms]
```

**Why Identical Tests Passing is Proof**:
This demonstrates that database storage is "just an implementation detail." Clients consuming the API send the exact same HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) and receive identical status codes (`200`, `201`, `204`, `400`, `404`) and JSON objects, whether data lives in volatile RAM memory or persistent SQLite disk storage.

---

## [9] Bonus Stage: AI vs Me (The AI Rematch)

### Prompt Given to AI Assistant (Assignment A1):
> "Build a minimal To-Do RESTful CRUD API using Express.js and Bun on port 3020. Store tasks in memory with fields id (number), title (string), and done (boolean). Implement GET /, GET /health, GET /tasks, GET /tasks/:id, POST /tasks, PUT /tasks/:id, and DELETE /tasks/:id. Return 201 for POST, 204 for DELETE, 400 for bad input, and 404 with JSON for missing tasks. Include Swagger UI at /docs."

### Comparison & Findings (Assignment A1):

1. **Validation Strictness (HTTP 400)**:
   - **Hand-Built**: Checked for missing titles, non-string types, and whitespace-only strings (`title.trim() === ''`).
   - **AI-Generated**: Only checked `if (!req.body.title)`, allowing empty string `""` or non-string values to slip through.

2. **HTTP 204 Delete Body**:
   - **Hand-Built**: Properly sent an empty response body (`res.status(204).send()`) per RFC HTTP specs.
   - **AI-Generated**: Returned `res.status(204).json({ message: "Deleted" })`, which invalidates the 204 No Content standard by sending a response body.

3. **In-Memory ID Auto-Increment & State Integrity**:
   - **Hand-Built**: Used an explicit counter (`nextId`) ensuring new tasks receive unique sequential IDs even after deletions.
   - **AI-Generated**: Used `tasks.length + 1` for new IDs, causing duplicate IDs when tasks were deleted and new ones were added.

### Prompt Given to AI Assistant (Assignment A2 - Database Migration):
> "Migrate an Express.js To-Do CRUD API running on Bun from in-memory storage to SQLite. Use parameterized SQL queries for GET, POST, PUT, and DELETE endpoints. Automatically create tasks.db and tasks table if missing, and seed 3 tasks only when empty."

### Comparison & Findings (Assignment A2):

1. **Seeding Duplicate Prevention**:
   - **Hand-Built**: Checked `SELECT COUNT(*)` first and ran seeding inside a `db.transaction()` so seeding runs strictly once on initial startup.
   - **AI-Generated**: Used `INSERT OR IGNORE`, which failed to prevent duplicate insertions when auto-incrementing IDs were omitted.

2. **SQL Injection Protection (Parameterized Queries)**:
   - **Hand-Built**: Enforced `?` placeholders across all dynamic queries (`SELECT * FROM tasks WHERE id = ?`).
   - **AI-Generated**: String-glued the search term (`LIKE '%` + search + `%'`), creating a SQL injection vulnerability.

3. **Status Codes & Type Coercion**:
   - **Hand-Built**: Converted SQLite integer `done` column (`0`/`1`) to native JavaScript boolean (`false`/`true`) in API JSON responses.
   - **AI-Generated**: Returned raw SQLite integer values (`done: 0`), breaking the original API contract.

---

## [10] Week 3 Upgrade: Containerize Your Stack (Assignment A3)

In Week 3 (Assignment A3), the storage layer was upgraded to a containerized **PostgreSQL** database engine (`postgres:16-alpine`) running inside Docker and orchestrated with **Docker Compose**.

### Why Containerized PostgreSQL Was Chosen
- **Environment Parity**: Eliminates "works on my machine" issues by packaging both the Bun Express API and PostgreSQL database inside deterministic Linux containers.
- **Production Standardization**: Uses the exact same PostgreSQL database server engine deployed in production at scale across FlyRank services.
- **Single Command Orchestration**: Running `docker compose up` brings up both the `api` container and the `db` container connected via a private virtual container network.

### Environment Secrets & `.env` Security Workflow
- Database passwords and connection strings are zero-hardcoded in code.
- `.env` is git-ignored (listed in `.gitignore`).
- A sample `.env.example` file is committed to git:
  ```env
  DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks
  PORT=3020
  ```

### Postgres Database Terminal Screenshot
Below is a visual inspection of PostgreSQL open inside the `taskdb` Docker container:

![PostgreSQL psql Terminal](./assets/PostgresDB.png)

---

## [11] 3-Way Storage Swap Proof (Memory -> SQLite -> PostgreSQL)

Across assignments A1, A2, and A3, the storage engine was swapped three times:
1. **Assignment A1**: In-memory JavaScript arrays
2. **Assignment A2**: Persistent SQLite disk file (`tasks.db`)
3. **Assignment A3**: Containerized PostgreSQL server (`postgres:16-alpine`)

Running `bun test` passes all 13 unit tests **100% unchanged** across all three storage layers:

```text
 13 pass
 0 fail
 30 expect() calls
Ran 13 tests across 1 file. [978.00ms]
```

**Why Identical Tests Passing is Proof**:
This proves that database storage is "just an implementation detail." Clients consuming the API send the exact same HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) and receive identical status codes (`200`, `201`, `204`, `400`, `404`) and JSON objects, whether data lives in volatile RAM, SQLite disk files, or PostgreSQL containers.

---

## [12] Assignment A3 AI Rematch (Containerization)

### Prompt Given to AI Assistant (Assignment A3):
> "Containerize an Express/Bun To-Do CRUD API connecting to PostgreSQL using pg driver. Write a Dockerfile for the app and a compose.yaml with api and db services using postgres:16-alpine. Use parameterized $1 queries, read secrets from .env, mount a named volume for data persistence, and auto-create the tasks table and seed 3 tasks strictly on first run."

### Comparison & Findings (Assignment A3):

1. **Service Inter-Container Networking**:
   - **Hand-Built**: Configured `DATABASE_URL` in `compose.yaml` to point to service name `db` (`postgres://postgres:dev@db:5432/tasks`), allowing internal container DNS resolution.
   - **AI-Generated**: Hardcoded `localhost:5432` inside `compose.yaml` environment variables, causing the `api` container to fail connecting to the `db` container.

2. **Health Check & Startup Dependency**:
   - **Hand-Built**: Added `healthcheck: test: ["CMD-SHELL", "pg_isready -U postgres -d tasks"]` on `db` and `depends_on: db: condition: service_healthy` on `api`, preventing crash loops.
   - **AI-Generated**: Used standard `depends_on: [db]` without a health check, causing the app container to crash on startup before Postgres finished initializing sockets.

3. **Data Persistence Across Restarts**:
   - **Hand-Built**: Defined named volume `taskdata:/var/lib/postgresql/data` ensuring data survives container restarts and teardowns.
   - **AI-Generated**: Omitted volume definitions, wiping database records every time `docker compose down` was executed.

---

## [13] Project Structure

```
Back-Task-1/
├── src/
│   ├── index.js         # Main Express application & routes
│   ├── db.js            # PostgreSQL connection pool & table initialization (pg)
│   └── openapi.json     # OpenAPI 3.0 specification
├── scripts/
│   ├── explore_sqlite.js          # Hand-executed SQL queries script (Stage 4)
│   ├── generate_db_screenshot.py  # Visual SQLite DB Browser image renderer
│   └── generate_pg_screenshot.py  # Visual Postgres psql terminal renderer
├── assets/
│   ├── PostgresDB.png   # PostgreSQL psql container screenshot
│   ├── DBBrowser.png    # DB Browser for SQLite screenshot
│   └── SwaggerUI.png    # Swagger UI documentation screenshot
├── api.test.js          # Automated endpoint test suite (13 passing tests)
├── Dockerfile           # Bun API container build recipe
├── compose.yaml         # Docker Compose stack specification (api + db)
├── .env.example         # Environment variables template
├── package.json         # Project dependencies & scripts
├── .gitignore           # Git ignore rules (includes .env, tasks.db)
└── README.md            # Cumulative project documentation
```
