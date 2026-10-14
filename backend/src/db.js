import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;
export const pool = new Pool({ connectionString: config.DATABASE_URL, max: 10 });

export async function query(text, params) {
  return pool.query(text, params);
}

export async function checkDatabase() {
  const result = await query('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}
