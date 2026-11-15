const { run } = require('./connection');

/**
 * Initializes database tables, constraints, foreign keys, and indexes.
 * @param {sqlite3.Database} [db]
 * @returns {Promise<void>}
 */
async function initDatabase(db = null) {
  // Members Table
  await run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      phone TEXT,
      membership_type TEXT DEFAULT 'Standard',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, [], db);

  // Lockers Table
  // Case-insensitive uniqueness constraint via COLLATE NOCASE
  await run(`
    CREATE TABLE IF NOT EXISTS lockers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      floor INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, [], db);

  // Allotments Table
  // Foreign keys linking to members and lockers
  await run(`
    CREATE TABLE IF NOT EXISTS allotments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      locker_id INTEGER NOT NULL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (locker_id) REFERENCES lockers(id) ON DELETE CASCADE
    );
  `, [], db);

  // Helpful Indexes for Performance and Queries
  await run(`CREATE INDEX IF NOT EXISTS idx_lockers_floor ON lockers(floor);`, [], db);
  await run(`CREATE INDEX IF NOT EXISTS idx_allotments_member ON allotments(member_id);`, [], db);
  await run(`CREATE INDEX IF NOT EXISTS idx_allotments_locker ON allotments(locker_id);`, [], db);
  await run(`CREATE INDEX IF NOT EXISTS idx_allotments_status ON allotments(status);`, [], db);
}

module.exports = {
  initDatabase
};

