const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let dbInstance = null;

/**
 * Initializes and returns the SQLite database connection.
 * @param {string} [customPath] - Optional custom path or ':memory:'
 * @returns {sqlite3.Database}
 */
function getDatabase(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  // If a custom path is explicitly requested (e.g. for testing), close previous instance if open
  if (customPath && dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      // ignore
    }
    dbInstance = null;
  }

  const dbPath = customPath || process.env.DB_PATH || path.join(__dirname, 'fitnest.db');

  // If file-based and not :memory:, ensure directory exists
  if (dbPath !== ':memory:') {
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(`Error connecting to SQLite database at ${dbPath}:`, err.message);
    }
  });

  // Enable foreign keys constraint enforcement in SQLite
  db.run('PRAGMA foreign_keys = ON;');

  dbInstance = db;
  return dbInstance;
}

/**
 * Promisified db.run wrapper
 * @param {string} sql 
 * @param {Array} [params] 
 * @param {sqlite3.Database} [db]
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
function run(sql, params = [], db = null) {
  const activeDb = db || getDatabase();
  return new Promise((resolve, reject) => {
    activeDb.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Promisified db.get wrapper (returns first matching row)
 * @param {string} sql 
 * @param {Array} [params] 
 * @param {sqlite3.Database} [db]
 * @returns {Promise<any>}
 */
function get(sql, params = [], db = null) {
  const activeDb = db || getDatabase();
  return new Promise((resolve, reject) => {
    activeDb.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

/**
 * Promisified db.all wrapper (returns array of matching rows)
 * @param {string} sql 
 * @param {Array} [params] 
 * @param {sqlite3.Database} [db]
 * @returns {Promise<any[]>}
 */
function all(sql, params = [], db = null) {
  const activeDb = db || getDatabase();
  return new Promise((resolve, reject) => {
    activeDb.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Closes the active database connection
 * @param {sqlite3.Database} [db]
 * @returns {Promise<void>}
 */
function close(db = null) {
  const targetDb = db || dbInstance;
  return new Promise((resolve, reject) => {
    if (!targetDb) {
      return resolve();
    }
    targetDb.close((err) => {
      if (err) {
        return reject(err);
      }
      if (targetDb === dbInstance) {
        dbInstance = null;
      }
      resolve();
    });
  });
}

module.exports = {
  getDatabase,
  run,
  get,
  all,
  close
};
