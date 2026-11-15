const { run, all } = require('./connection');
const { initDatabase } = require('./init');

/**
 * Seeds initial demo data for members, lockers, and allotments if empty.
 * @param {sqlite3.Database} [db]
 */
async function seedDatabase(db = null) {
  await initDatabase(db);

  const existingLockers = await all('SELECT id FROM lockers LIMIT 1', [], db);
  if (existingLockers.length > 0) {
    return; // Already seeded or has data
  }

  // Seed Members
  await run(`
    INSERT INTO members (name, email, phone, membership_type) VALUES
    ('Alex Johnson', 'alex.johnson@fitnest.com', '555-0101', 'Premium'),
    ('Samantha Miller', 'samantha.m@fitnest.com', '555-0102', 'Standard'),
    ('David Chen', 'david.chen@fitnest.com', '555-0103', 'VIP'),
    ('Emily Watson', 'emily.w@fitnest.com', '555-0104', 'Standard');
  `, [], db);

  // Seed Lockers
  await run(`
    INSERT INTO lockers (name, floor, status) VALUES
    ('Locker 01', 1, 'occupied'),
    ('Locker 02', 1, 'available'),
    ('Locker 03', 1, 'available'),
    ('Locker 10', 2, 'occupied'),
    ('Locker 11', 2, 'available'),
    ('Locker 20', 3, 'available');
  `, [], db);

  // Seed Allotments
  await run(`
    INSERT INTO allotments (member_id, locker_id, status) VALUES
    (1, 1, 'active'),
    (2, 4, 'active');
  `, [], db);

  console.log('Database seeded successfully with initial FitNest Gym data.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

