const request = require('supertest');
const app = require('../src/app');
const { getDatabase } = require('../src/database/connection');
const { initDatabase } = require('../src/database/init');
const { seedDatabase } = require('../src/database/seed');

async function verify() {
  console.log('=== FitNest Gym Endpoints Verification ===\n');
  const db = getDatabase();
  await initDatabase(db);
  await seedDatabase(db);

  // 1. Health check
  console.log('1. Checking GET / (Health Check)...');
  const root = await request(app).get('/');
  console.log('   Status:', root.status);
  console.log('   Response:', JSON.stringify(root.body, null, 2));

  // 2. Lockers Floor Search
  console.log('\n2. Checking GET /lockers?floor=2 (Search)...');
  const floorSearch = await request(app).get('/lockers?floor=2');
  console.log('   Status:', floorSearch.status);
  console.log('   Found Lockers count:', floorSearch.body.length);
  console.log('   Lockers on floor 2:', floorSearch.body.map(l => ({ id: l.id, name: l.name, floor: l.floor })));

  // 3. JOIN Endpoint
  console.log('\n3. Checking GET /allotments/details (JOIN Endpoint)...');
  const joinDetails = await request(app).get('/allotments/details');
  console.log('   Status:', joinDetails.status);
  console.log('   Response Sample:', JSON.stringify(joinDetails.body.slice(0, 2), null, 2));

  // 4. Twist Test 1: Add Locker 12
  console.log('\n4. Twist Test 1: POST /lockers {"name": "Locker 12", "floor": 2} ...');
  const t1 = await request(app).post('/lockers').send({ name: 'Locker 12', floor: 2 });
  console.log('   Status:', t1.status, t1.status === 201 ? '✔ PASS' : '✖ FAIL');
  console.log('   Response:', t1.body);

  // 5. Twist Test 2: Add "locker 12" (lowercase duplicate)
  console.log('\n5. Twist Test 2: POST /lockers {"name": "locker 12", "floor": 2} ...');
  const t2 = await request(app).post('/lockers').send({ name: 'locker 12', floor: 2 });
  console.log('   Status:', t2.status, t2.status === 409 ? '✔ PASS' : '✖ FAIL');
  console.log('   Response:', t2.body);

  // 6. Twist Test 3: Setup Locker 99 and rename to Locker 12
  console.log('\n6. Twist Test 3 Setup: POST /lockers {"name": "Locker 99", "floor": 1} ...');
  const t3Setup = await request(app).post('/lockers').send({ name: 'Locker 99', floor: 1 });
  console.log('   Status:', t3Setup.status);
  const locker99Id = t3Setup.body.id;

  console.log(`\n7. Twist Test 3: PUT /lockers/${locker99Id} {"name": "Locker 12"} ...`);
  const t3 = await request(app).put(`/lockers/${locker99Id}`).send({ name: 'Locker 12' });
  console.log('   Status:', t3.status, t3.status === 409 ? '✔ PASS' : '✖ FAIL');
  console.log('   Response:', t3.body);

  console.log('\n=== All Verification Checks Complete! ===');
  process.exit(0);
}

verify().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});

