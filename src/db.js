import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:dev@localhost:5432/tasks';

const pool = new Pool({
  connectionString
});

export const initDb = async () => {
  const client = await pool.connect();
  try {
    // Stage 1: Create tasks table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    // Seed 3 example tasks ONLY if table is empty
    const { rows } = await client.query('SELECT COUNT(*)::int as count FROM tasks;');
    if (rows[0].count === 0) {
      await client.query('BEGIN');
      await client.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Learn Express & Bun', true]);
      await client.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Build CRUD API', false]);
      await client.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Setup Swagger UI', false]);
      await client.query('COMMIT');
      console.log('[Postgres] Table initialized & seeded with 3 example tasks.');
    } else {
      console.log(`[Postgres] Database connected. Found ${rows[0].count} task(s).`);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Postgres] Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
};

export const query = (text, params) => pool.query(text, params);
export default pool;
