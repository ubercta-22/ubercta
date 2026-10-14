import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { config } from './config.js';

const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 1 });
try {
  const migration = await readFile(new URL('../database/migrations/001_initial_schema.sql', import.meta.url), 'utf8');
  await pool.query(migration);
  console.log('Initial database schema is ready.');
} finally {
  await pool.end();
}
