const { DatabaseSync } = require('node:sqlite');
const { Pool } = require('pg');

const sqliteDb = new DatabaseSync('./ecommerce_v2.db');

const pgUrl = 'postgresql://neondb_owner:npg_PFsYrGj3D7hy@ep-polished-firefly-adqnpz7i-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

const pool = new Pool({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function migrateProducts() {
  const rows = sqliteDb.prepare('SELECT * FROM products').all();
  console.log(`Found ${rows.length} products in local SQLite database.`);
  
  let count = 0;
  for (const row of rows) {
    try {
      const check = await pool.query('SELECT id FROM products WHERE name = $1', [row.name]);
      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO products (name, price, image, description, category, gender, sizes, colors) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [row.name, row.price, row.image, row.description, row.category, row.gender, row.sizes, row.colors]
        );
        count++;
      }
    } catch (e) {
      console.error(`Failed to migrate product ${row.name}:`, e.message);
    }
  }
  console.log(`Successfully migrated ${count} new products to Neon PostgreSQL!`);
}

async function migrateUsers() {
  const rows = sqliteDb.prepare('SELECT * FROM users').all();
  console.log(`Found ${rows.length} users in local SQLite database.`);
  
  let count = 0;
  for (const row of rows) {
    try {
      const check = await pool.query('SELECT id FROM users WHERE email = $1', [row.email]);
      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (username, email, password, google_id, role, points, plain_password) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [row.username, row.email, row.password, row.google_id, row.role || 'user', row.points || 500, row.plain_password || null]
        );
        count++;
      }
    } catch (e) {
      console.error(`Failed to migrate user ${row.email}:`, e.message);
    }
  }
  console.log(`Successfully migrated ${count} new users to Neon PostgreSQL!`);
}

async function runMigration() {
  console.log("Starting Migration...");
  try {
    await migrateProducts();
    await migrateUsers();
    console.log("Migration Complete! You can now check your live website.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
    sqliteDb.close();
  }
}

runMigration();
