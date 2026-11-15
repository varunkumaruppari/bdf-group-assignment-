const path = require('path');
const fs = require('fs');

// Ensure isolated environment variables BEFORE any application module loads
const TEST_PORT = 3001;
const TEST_DB_PATH = path.resolve(__dirname, '../src/database/fitnest_test.db');
const ORIGINAL_DB_PATH = path.resolve(__dirname, '../src/database/fitnest.db');

process.env.PORT = String(TEST_PORT);
process.env.DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = 'test';

const app = require('../src/app');
const { getDatabase, all, close } = require('../src/database/connection');
const { initDatabase } = require('../src/database/init');
const { seedDatabase } = require('../src/database/seed');

async function startTestServer() {
  try {
    // Check if reset flag is passed (e.g. node scripts/start-test-server.js --reset)
    const shouldReset = process.argv.includes('--reset');
    if (shouldReset && fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
        console.log('[Test Environment] Previous test database removed for clean reset.');
      } catch (err) {
        // ignore
      }
    }

    // Connect to TEST database
    const db = getDatabase(TEST_DB_PATH);
    await initDatabase(db);
    await seedDatabase(db);

    // Verify whether Locker 12 exists in test DB
    const locker12 = await all(
      "SELECT id, name, floor, status FROM lockers WHERE LOWER(TRIM(name)) = 'locker 12'",
      [],
      db
    );

    // Verify original DB is distinct and unchanged
    const originalExists = fs.existsSync(ORIGINAL_DB_PATH);

    const server = app.listen(TEST_PORT, () => {
      console.log('================================================================');
      console.log(`FitNest Gym ISOLATED TEST SERVER is running on http://localhost:${TEST_PORT}`);
      console.log('================================================================');
      console.log(`• Test Database File:     ${TEST_DB_PATH}`);
      console.log(`• Original Database File: ${ORIGINAL_DB_PATH} (${originalExists ? 'SAFE & UNTOUCHED' : 'Not found'})`);
      console.log(`• "Locker 12" Status:      ${locker12.length > 0 ? `FOUND (ID: ${locker12[0].id})` : 'DOES NOT EXIST (Ready for Test 1)'}`);
      console.log('----------------------------------------------------------------');
      console.log(`• Health Check:           GET  http://localhost:${TEST_PORT}/`);
      console.log(`• All Lockers:            GET  http://localhost:${TEST_PORT}/lockers`);
      console.log(`• Test 1 (Add Locker 12): POST http://localhost:${TEST_PORT}/lockers`);
      console.log('  Payload: {"name": "Locker 12", "floor": 2}');
      console.log('================================================================');
    });

    const shutdown = async () => {
      console.log('\nShutting down FitNest Gym Test Server...');
      server.close(async () => {
        await close(db);
        console.log('Test database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start test server:', error);
    process.exit(1);
  }
}

startTestServer();

