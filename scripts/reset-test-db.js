const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.resolve(__dirname, '../src/database/fitnest_test.db');
const ORIGINAL_DB_PATH = path.resolve(__dirname, '../src/database/fitnest.db');

async function resetTestDb() {
  console.log('--- Resetting FitNest Test Database ---');
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
    console.log(`Deleted test database: ${TEST_DB_PATH}`);
  } else {
    console.log(`No existing test database to delete.`);
  }

  process.env.DB_PATH = TEST_DB_PATH;
  process.env.NODE_ENV = 'test';

  const { getDatabase, all, close } = require('../src/database/connection');
  const { initDatabase } = require('../src/database/init');
  const { seedDatabase } = require('../src/database/seed');

  const db = getDatabase(TEST_DB_PATH);
  await initDatabase(db);
  await seedDatabase(db);

  const lockers = await all('SELECT id, name, floor, status FROM lockers', [], db);
  const locker12 = lockers.find(l => l.name.toLowerCase() === 'locker 12');

  console.log(`\nTest database freshly initialized:`);
  console.log(`• Locker count: ${lockers.length}`);
  console.log(`• Lockers present: ${lockers.map(l => l.name).join(', ')}`);
  console.log(`• "Locker 12" exists: ${locker12 ? 'YES' : 'NO (Ready for Test 1)'}`);
  console.log(`• Original database (fitnest.db) is UNCHANGED.`);

  await close(db);
}

resetTestDb().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});

