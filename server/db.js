import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getDbConnection() {
  if (db) return db;

  const dbPath = path.join(__dirname, 'database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.get("PRAGMA foreign_keys = ON");

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      marks REAL DEFAULT 0.0,
      stream TEXT DEFAULT '',
      home_state TEXT DEFAULT '',
      income REAL DEFAULT 0.0,
      category TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      course_year TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create submissions table (compatible with old schema)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      income REAL NOT NULL,
      marks REAL NOT NULL,
      category TEXT NOT NULL,
      course_year TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Self-healing migration to add user_id column if it doesn't exist
  try {
    await db.exec(`ALTER TABLE submissions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    console.log('Database schema successfully migrated: user_id column added to submissions table.');
  } catch (migrationError) {
    // If the column already exists, SQLite throws: SQLITE_ERROR: duplicate column name: user_id
    // We ignore duplicate column errors
    if (!migrationError.message.includes('duplicate column name') && !migrationError.message.includes('already exists')) {
      console.error('Warning: Submissions table migration encountered unexpected error:', migrationError.message);
    }
  }

  return db;
}

export async function initDb() {
  try {
    const connection = await getDbConnection();
    console.log('SQLite database initialized successfully at:', path.join(__dirname, 'database.sqlite'));
    return connection;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User Actions
export async function createUser(email, password, name) {
  const connection = await getDbConnection();
  const passwordHash = hashPassword(password);
  
  const result = await connection.run(
    `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`,
    [email, passwordHash, name]
  );
  return result.lastID;
}

export async function getUserByEmail(email) {
  const connection = await getDbConnection();
  const user = await connection.get(
    `SELECT id, email, password, name, marks, stream, home_state, income, category, gender, course_year FROM users WHERE email = ?`,
    [email]
  );
  return user || null;
}

export async function getUserById(id) {
  const connection = await getDbConnection();
  const user = await connection.get(
    `SELECT id, email, name, marks, stream, home_state, income, category, gender, course_year FROM users WHERE id = ?`,
    [id]
  );
  return user || null;
}

export async function updateUserProfile(id, { name, marks, stream, home_state, income, category, gender, course_year }) {
  const connection = await getDbConnection();
  const result = await connection.run(
    `UPDATE users 
     SET name = ?, marks = ?, stream = ?, home_state = ?, income = ?, category = ?, gender = ?, course_year = ? 
     WHERE id = ?`,
    [name, marks, stream, home_state, income, category, gender, course_year, id]
  );
  return result.changes > 0;
}

// Submissions Actions
export async function saveSubmission(name, income, marks, category, courseYear, resultJson, userId = null) {
  const connection = await getDbConnection();
  const result = await connection.run(
    `INSERT INTO submissions (name, income, marks, category, course_year, result_json, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, income, marks, category, courseYear, JSON.stringify(resultJson), userId]
  );
  return result.lastID;
}

export async function getSubmissions(userId = null) {
  const connection = await getDbConnection();
  let rows;
  if (userId) {
    rows = await connection.all(
      `SELECT * FROM submissions WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
  } else {
    rows = await connection.all(
      `SELECT * FROM submissions ORDER BY created_at DESC`
    );
  }
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    income: row.income,
    marks: row.marks,
    category: row.category,
    course_year: row.course_year,
    result_json: JSON.parse(row.result_json),
    created_at: row.created_at
  }));
}

export async function deleteSubmission(id) {
  const connection = await getDbConnection();
  const result = await connection.run(
    `DELETE FROM submissions WHERE id = ?`,
    [id]
  );
  return result.changes > 0;
}
