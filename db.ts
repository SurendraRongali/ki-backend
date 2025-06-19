import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./shared/schema";
import dotenv from 'dotenv'
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool for Amazon RDS PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  min: 5,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: {
    rejectUnauthorized: false // Required for Amazon RDS SSL connections
  }
});

// Add error handling for pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });

// Test database connection on startup
export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    client.release();
    console.log('✅ Amazon RDS PostgreSQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ Amazon RDS PostgreSQL connection failed:', error);
    return false;
  }
}