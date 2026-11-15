const request = require('supertest');
const app = require('../src/app');
const { getDatabase, close } = require('../src/database/connection');
const { initDatabase } = require('../src/database/init');

describe('Duplicate Locker Name Twist Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    // Use fresh in-memory database for clean test isolation
    const db = getDatabase(':memory:');
    await initDatabase(db);
  });

  afterAll(async () => {
    await close();
  });

  let locker12Id;
  let locker99Id;

  // Twist Test 1: Add Locker 12 -> 201
  test('Twist Test 1: Add "Locker 12" -> 201 Created', async () => {
    const res = await request(app)
      .post('/lockers')
      .send({
        name: 'Locker 12',
        floor: 2
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Locker 12');
    expect(res.body.floor).toBe(2);
    expect(res.body.status).toBe('available');
    locker12Id = res.body.id;
  });

  // Twist Test 2: Add "locker 12" (lowercase) -> 409 Conflict
  test('Twist Test 2: Add "locker 12" (case-insensitive duplicate) -> 409 Conflict', async () => {
    const res = await request(app)
      .post('/lockers')
      .send({
        name: 'locker 12',
        floor: 2
      });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'Locker 12 already exists'
    });
  });

  // Additional case-variant check: "LOCKER 12" -> 409 Conflict
  test('Twist Test 2 (variant): Add "LOCKER 12" (uppercase) -> 409 Conflict', async () => {
    const res = await request(app)
      .post('/lockers')
      .send({
        name: 'LOCKER 12',
        floor: 1
      });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'Locker 12 already exists'
    });
  });

  // Setup for Twist Test 3: Create a second locker
  test('Setup for Test 3: Add "Locker 99" -> 201 Created', async () => {
    const res = await request(app)
      .post('/lockers')
      .send({
        name: 'Locker 99',
        floor: 1
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Locker 99');
    locker99Id = res.body.id;
  });

  // Twist Test 3: Rename another locker ("Locker 99") to the same name ("Locker 12") -> 409
  test('Twist Test 3: Rename "Locker 99" to "Locker 12" -> 409 Conflict', async () => {
    const res = await request(app)
      .put(`/lockers/${locker99Id}`)
      .send({
        name: 'Locker 12',
        floor: 1
      });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'Locker 12 already exists'
    });
  });

  // Twist Test 3 (variant): Rename to lowercase "locker 12" -> 409 Conflict
  test('Twist Test 3 (variant): Rename "Locker 99" to "locker 12" -> 409 Conflict', async () => {
    const res = await request(app)
      .put(`/lockers/${locker99Id}`)
      .send({
        name: 'locker 12',
        floor: 1
      });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'Locker 12 already exists'
    });
  });

  // Self-update exclusion test: Locker 12 updating itself should succeed
  test('Self-Update: "Locker 12" updating floor while keeping name should succeed -> 200 OK', async () => {
    const res = await request(app)
      .put(`/lockers/${locker12Id}`)
      .send({
        name: 'Locker 12',
        floor: 3
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Locker 12');
    expect(res.body.floor).toBe(3);
  });

  // Concurrent Twist Test: Multiple simultaneous requests creating "Locker 55"
  test('Concurrent Twist Test: Multiple simultaneous requests creating "Locker 55" result in exactly one 201 and remaining 409s', async () => {
    const concurrentRequests = Array.from({ length: 6 }, () =>
      request(app)
        .post('/lockers')
        .send({ name: 'Locker 55', floor: 2 })
    );

    const responses = await Promise.all(concurrentRequests);
    const success = responses.filter(r => r.status === 201);
    const conflicts = responses.filter(r => r.status === 409);

    expect(success.length).toBe(1);
    expect(conflicts.length).toBe(5);

    conflicts.forEach(res => {
      expect(res.body).toEqual({
        error: 'Locker 55 already exists'
      });
    });
  });
});

