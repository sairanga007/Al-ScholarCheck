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

  // Create scholarships table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scholarships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scholarship_name TEXT NOT NULL,
      minimum_marks INTEGER,
      income_limit INTEGER,
      category TEXT,
      deadline DATE,
      application_link TEXT,
      description TEXT
    )
  `);

  // Create student_scholarships table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS student_scholarships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scholarship_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('SAVED', 'APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, scholarship_name)
    )
  `);

  // Create notifications table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create community_posts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Alter users table to add streak and badge fields (self-healing migration)
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 1`);
  } catch (err) {}
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN last_active_date TEXT DEFAULT ''`);
  } catch (err) {}
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN badges_json TEXT DEFAULT '[]'`);
  } catch (err) {}

  // Seed sample community posts if empty
  try {
    const postCount = await db.get("SELECT COUNT(*) as count FROM community_posts");
    if (postCount.count === 0) {
      await db.run(`
        INSERT INTO community_posts (author_name, role, content, likes)
        VALUES 
        ('Rahul Sharma', 'Alumni (JNTU)', 'I received the Dr. Ambedkar Post Matric Scholarship last year. Keep your income certificate updated and apply in the first week!', 24),
        ('Priya Patel', 'Mentor (ScholarSphere)', 'AICTE Pragati scholarship is open. Girl students in technical streams, make sure you double check your marks percentage matches 50%+.', 18),
        ('Sai Kumar', 'Student (Vasavi College)', 'Just submitted my TS ePASS application! The RTF fee waiver is fully approved by our college admin. Best of luck guys!', 12)
      `);
    }
  } catch (err) {
    console.error('Sample community posts seeding error:', err);
  }

  return db;
}

export async function initDb() {
  try {
    const connection = await getDbConnection();
    console.log('SQLite database initialized successfully at:', path.join(__dirname, 'database.sqlite'));
    await seedScholarships();
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
    `SELECT id, email, password, name, marks, stream, home_state, income, category, gender, course_year, streak_count, last_active_date, badges_json FROM users WHERE email = ?`,
    [email]
  );
  return user || null;
}

export async function getUserById(id) {
  const connection = await getDbConnection();
  const user = await connection.get(
    `SELECT id, email, name, marks, stream, home_state, income, category, gender, course_year, streak_count, last_active_date, badges_json FROM users WHERE id = ?`,
    [id]
  );
  return user || null;
}

export async function updateStreakAndBadges(userId) {
  const connection = await getDbConnection();
  const user = await connection.get(
    `SELECT id, streak_count, last_active_date, badges_json, name, marks, stream, home_state, income, category, gender, course_year FROM users WHERE id = ?`,
    [userId]
  );
  if (!user) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  let streak = user.streak_count || 1;
  let lastActive = user.last_active_date || '';

  if (lastActive === '') {
    streak = 1;
    lastActive = todayStr;
    await connection.run(`UPDATE users SET streak_count = ?, last_active_date = ? WHERE id = ?`, [streak, lastActive, userId]);
  } else if (lastActive !== todayStr) {
    const lastActiveDate = new Date(lastActive);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate - lastActiveDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
    lastActive = todayStr;
    await connection.run(`UPDATE users SET streak_count = ?, last_active_date = ? WHERE id = ?`, [streak, lastActive, userId]);
  }

  // Evaluate badges
  let badges = [];
  try {
    badges = JSON.parse(user.badges_json || '[]');
  } catch (e) {
    badges = [];
  }

  const addBadge = (badgeId, name, desc, icon) => {
    if (!badges.find(b => b.id === badgeId)) {
      badges.push({ id: badgeId, name, desc, icon, date: todayStr });
      return true;
    }
    return false;
  };

  let badgeAdded = false;

  // Profile completion badge
  const isComplete = user.name && user.marks && user.stream && user.home_state && user.income && user.category && user.gender && user.course_year;
  if (isComplete) {
    if (addBadge('profile_hero', 'Profile Hero', 'Completed all student profile parameters', 'UserCheck')) {
      badgeAdded = true;
    }
  }

  // Streak badge
  if (streak >= 3) {
    if (addBadge('streak_star', 'Streak Star', 'Maintained a daily login streak of 3+ days', 'Flame')) {
      badgeAdded = true;
    }
  }

  // Check tracked applications for milestones
  const trackerCount = await connection.get("SELECT COUNT(*) as count FROM student_scholarships WHERE user_id = ?", [userId]);
  if (trackerCount.count > 0) {
    if (addBadge('first_app', 'First Application', 'Added a scholarship to the tracker', 'Briefcase')) {
      badgeAdded = true;
    }
  }

  if (badgeAdded) {
    await connection.run(`UPDATE users SET badges_json = ? WHERE id = ?`, [JSON.stringify(badges), userId]);
  }

  return { streak, lastActive, badges };
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

// Seeding sample scholarships
export async function seedScholarships() {
  const connection = await getDbConnection();
  
  // Check if scholarships table is empty
  const count = await connection.get('SELECT COUNT(*) as count FROM scholarships');
  if (count.count > 0) {
    console.log('Scholarships table already seeded.');
    return;
  }
  
  console.log('Seeding scholarships table...');
  const sampleScholarships = [
    {
      name: "National Scholarship Portal",
      min_marks: 50,
      income_limit: 200000,
      category: "Minority",
      deadline: "2026-08-25",
      link: "https://scholarships.gov.in",
      description: "Central sector scheme providing support to meritorious minority students."
    },
    {
      name: "Telangana ePASS Post Matric Scholarship (SC/ST)",
      min_marks: 60,
      income_limit: 200000,
      category: "SC",
      deadline: "2026-06-29",
      link: "https://telanganaepass.cgg.gov.in/",
      description: "Full tuition fee reimbursement for SC/ST category students in Telangana."
    },
    {
      name: "Telangana ePASS Post Matric Scholarship (BC/EBC/Minority)",
      min_marks: 55,
      income_limit: 150000,
      category: "OBC",
      deadline: "2026-07-20",
      link: "https://telanganaepass.cgg.gov.in/",
      description: "Partial or full fee reimbursement for BC/OBC students in Telangana."
    },
    {
      name: "Dr. Ambedkar Post Matric Scholarship for SC Students",
      min_marks: 50,
      income_limit: 250000,
      category: "SC",
      deadline: "2026-08-30",
      link: "https://scholarships.gov.in/",
      description: "Centrally sponsored scheme for post-matric studies of SC students."
    },
    {
      name: "Post Matric Scholarship for ST Students (Ministry of Tribal Affairs)",
      min_marks: 50,
      income_limit: 250000,
      category: "ST",
      deadline: "2026-09-10",
      link: "https://tribal.nic.in/",
      description: "Financial assistance for ST students pursuing post-matric courses."
    },
    {
      name: "NSP Post Matric Scholarship for Minorities (National Scholarship Portal)",
      min_marks: 50,
      income_limit: 200000,
      category: "Minority",
      deadline: "2026-08-20",
      link: "https://scholarships.gov.in/",
      description: "Scholarship scheme for minority students to encourage higher education."
    },
    {
      name: "PM-YASASVI Post-Matric Scholarship for OBC, EBC and DNT Students",
      min_marks: 60,
      income_limit: 250000,
      category: "OBC",
      deadline: "2026-08-15",
      link: "https://scholarships.gov.in/",
      description: "Central government scheme for OBC, EBC and DNT category students."
    },
    {
      name: "Post Matric Scholarship for EWS Students (General Category)",
      min_marks: 60,
      income_limit: 100000,
      category: "EWS",
      deadline: "2026-07-10",
      link: "https://scholarships.gov.in/",
      description: "Financial assistance for general category EWS students."
    },
    {
      name: "Vidyadhan Scholarship (Sarojini Damodaran Foundation)",
      min_marks: 75,
      income_limit: 200000,
      category: "General",
      deadline: "2026-06-10",
      link: "https://www.vidyadhan.org/",
      description: "Private scholarship supporting meritorious students from low-income families."
    },
    {
      name: "Sitaram Jindal Foundation Scholarship",
      min_marks: 55,
      income_limit: 250000,
      category: "General",
      deadline: "2026-07-30",
      link: "http://www.sitaramjindalfoundation.org/",
      description: "Monthly stipend support for undergraduate and postgraduate students."
    },
    {
      name: "HDFC Bank Badhte Kadam Scholarship",
      min_marks: 60,
      income_limit: 600000,
      category: "General",
      deadline: "2026-07-25",
      link: "https://www.hdfcbank.com/",
      description: "HDFC Foundation scholarship program supporting general category students."
    },
    {
      name: "Sri Gowthami Merit-cum-Means Institutional Scholarship",
      min_marks: 85,
      income_limit: 300000,
      category: "General",
      deadline: "2026-07-12",
      link: "https://srigowthami.edu.in/scholarships",
      description: "Institutional tuition waiver for high-performing students."
    },
    {
      name: "Sri Gowthami Special Merit Scholarship (General Category)",
      min_marks: 92,
      income_limit: 250000,
      category: "General",
      deadline: "2026-06-27",
      link: "https://srigowthami.edu.in/scholarships",
      description: "Special institutional scholarship for top scoring general category students."
    },
    {
      name: "Tata Capital Pankh Scholarship",
      min_marks: 60,
      income_limit: 400000,
      category: "General",
      deadline: "2026-08-05",
      link: "https://www.tatacapital.com/",
      description: "Pankh scholarship program by Tata Capital for higher education."
    },
    {
      name: "L'Oréal India For Young Women In Science Scholarship",
      min_marks: 80,
      income_limit: 600000,
      category: "General",
      deadline: "2026-10-30",
      link: "https://www.loreal.com/en/india/",
      description: "L'Oréal scholarship program supporting girl students in STEM fields."
    },
    {
      name: "Kotak Kanya Scholarship",
      min_marks: 85,
      income_limit: 600000,
      category: "General",
      deadline: "2026-09-30",
      link: "https://kotakeducation.org/",
      description: "Kotak Foundation scholarship for meritorious girls pursuing professional courses."
    },
    {
      name: "Begum Hazrat Mahal National Scholarship for Minorities (Girls)",
      min_marks: 50,
      income_limit: 200000,
      category: "Minority",
      deadline: "2026-10-31",
      link: "https://maef.nic.in/",
      description: "National scholarship scheme for minority community girl students."
    },
    {
      name: "AICTE Pragati Scholarship for Girls",
      min_marks: 50,
      income_limit: 800000,
      category: "General",
      deadline: "2026-12-31",
      link: "https://www.aicte-india.org/bureaus/development/pragati-scholarship",
      description: "AICTE scheme providing support to girl students in technical streams."
    },
    {
      name: "Maulana Azad National Fellowship (MANF)",
      min_marks: 65,
      income_limit: 250000,
      category: "Minority",
      deadline: "2026-08-31",
      link: "https://ugc.ac.in/",
      description: "MANF fellowship scheme for minority students pursuing higher education."
    },
    {
      name: "Central Sector Scheme of Scholarship (CSSS)",
      min_marks: 80,
      income_limit: 450000,
      category: "General",
      deadline: "2026-10-31",
      link: "https://scholarships.gov.in/",
      description: "CSSS merit-cum-means scholarship by Central Government."
    },
    {
      name: "Reliance Foundation Undergraduate Scholarship",
      min_marks: 60,
      income_limit: 1500000,
      category: "General",
      deadline: "2026-11-30",
      link: "https://www.reliancefoundation.org/",
      description: "Reliance Foundation scholarship program for undergraduate studies."
    },
    {
      name: "AICTE Saksham Scholarship for Specially Abled Students",
      min_marks: 45,
      income_limit: 800000,
      category: "General",
      deadline: "2026-12-31",
      link: "https://www.aicte-india.org/",
      description: "Scholarship scheme for specially abled students."
    },
    {
      name: "DST INSPIRE Scholarship",
      min_marks: 88,
      income_limit: 600000,
      category: "General",
      deadline: "2026-10-31",
      link: "https://online-inspire.gov.in/",
      description: "DST fellowship for top tier science stream students."
    }
  ];

  for (const s of sampleScholarships) {
    await connection.run(
      `INSERT INTO scholarships (scholarship_name, minimum_marks, income_limit, category, deadline, application_link, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.name, s.min_marks, s.income_limit, s.category, s.deadline, s.link, s.description]
    );
  }
  console.log('Scholarships table seeded successfully.');
}

export async function getAllScholarships() {
  const connection = await getDbConnection();
  return await connection.all(`SELECT * FROM scholarships`);
}

export async function getEligibleScholarships(marks, income, category) {
  const connection = await getDbConnection();
  return await connection.all(
    `SELECT * FROM scholarships 
     WHERE minimum_marks <= ? 
       AND income_limit >= ? 
       AND (LOWER(category) = LOWER(?) OR LOWER(category) = 'general')`,
    [parseFloat(marks) || 0, parseFloat(income) || 0, category]
  );
}

// Tracker Actions
export async function getTrackedScholarships(userId) {
  const connection = await getDbConnection();
  return await connection.all(
    `SELECT * FROM student_scholarships WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId]
  );
}

export async function updateTrackedScholarship(userId, scholarshipName, status) {
  const connection = await getDbConnection();
  // UPSERT
  await connection.run(
    `INSERT INTO student_scholarships (user_id, scholarship_name, status)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, scholarship_name) 
     DO UPDATE SET status = ?, updated_at = CURRENT_TIMESTAMP`,
    [userId, scholarshipName, status, status]
  );
  return true;
}

// Notification Actions
export async function getNotifications(userId) {
  const connection = await getDbConnection();
  return await connection.all(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
}

export async function createNotification(userId, type, title, message) {
  const connection = await getDbConnection();
  await connection.run(
    `INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)`,
    [userId, type, title, message]
  );
  return true;
}

export async function markNotificationAsRead(id) {
  const connection = await getDbConnection();
  await connection.run(
    `UPDATE notifications SET is_read = 1 WHERE id = ?`,
    [id]
  );
  return true;
}

// Community Actions
export async function getCommunityPosts() {
  const connection = await getDbConnection();
  return await connection.all(
    `SELECT * FROM community_posts ORDER BY created_at DESC`
  );
}

export async function createCommunityPost(userId, authorName, role, content) {
  const connection = await getDbConnection();
  await connection.run(
    `INSERT INTO community_posts (user_id, author_name, role, content) VALUES (?, ?, ?, ?)`,
    [userId, authorName, role, content]
  );
  return true;
}
