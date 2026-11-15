const request = require('supertest');
const app = require('../src/app');
const { getDatabase, close } = require('../src/database/connection');
const { initDatabase } = require('../src/database/init');

describe('Allotments & JOIN Endpoint Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const db = getDatabase(':memory:');
    await initDatabase(db);
  });

  afterAll(async () => {
    await close();
  });

  let member1Id;
  let member2Id;
  let locker1Id;
  let locker2Id;
  let allotmentId;

  // Setup sample members and lockers
  beforeAll(async () => {
    const mem1 = await request(app)
      .post('/members')
      .send({ name: 'Alice Cooper', email: 'alice@fitnest.com' });
    member1Id = mem1.body.id;

    const mem2 = await request(app)
      .post('/members')
      .send({ name: 'Bob Dylan', email: 'bob@fitnest.com' });
    member2Id = mem2.body.id;

    const lock1 = await request(app)
      .post('/lockers')
      .send({ name: 'Locker 301', floor: 3 });
    locker1Id = lock1.body.id;

    const lock2 = await request(app)
      .post('/lockers')
      .send({ name: 'Locker 302', floor: 3 });
    locker2Id = lock2.body.id;
  });

  describe('POST /allotments (Validation & Creation)', () => {
    test('should return 400 if member_id or locker_id is missing', async () => {
      const res = await request(app)
        .post('/allotments')
        .send({ member_id: member1Id });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/locker_id is required/i);
    });

    test('should return 404 if member does not exist', async () => {
      const res = await request(app)
        .post('/allotments')
        .send({ member_id: 9999, locker_id: locker1Id });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/member with id 9999 not found/i);
    });

    test('should return 404 if locker does not exist', async () => {
      const res = await request(app)
        .post('/allotments')
        .send({ member_id: member1Id, locker_id: 9999 });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/locker with id 9999 not found/i);
    });

    test('should create an allotment successfully -> 201 Created', async () => {
      const res = await request(app)
        .post('/allotments')
        .send({
          member_id: member1Id,
          locker_id: locker1Id
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.member_id).toBe(member1Id);
      expect(res.body.locker_id).toBe(locker1Id);
      expect(res.body.status).toBe('active');
      allotmentId = res.body.id;

      // Verify locker status is now 'occupied'
      const checkLocker = await request(app).get(`/lockers/${locker1Id}`);
      expect(checkLocker.body.status).toBe('occupied');
    });

    test('Conflict: Prevent assigning an already-occupied locker to another member -> 409', async () => {
      const res = await request(app)
        .post('/allotments')
        .send({
          member_id: member2Id,
          locker_id: locker1Id // Already allotted to Alice Cooper
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already occupied/i);
    });

    test('Conflict: Prevent member from having multiple active lockers -> 409', async () => {
      const res = await request(app)
        .post('/allotments')
        .send({
          member_id: member1Id, // Alice Cooper already has Locker 301
          locker_id: locker2Id
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already has an active locker allotment/i);
    });
  });

  describe('GET /allotments', () => {
    test('should return all allotments -> 200 OK', async () => {
      const res = await request(app).get('/allotments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    test('should return a single allotment by ID -> 200 OK', async () => {
      const res = await request(app).get(`/allotments/${allotmentId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(allotmentId);
    });
  });

  describe('JOIN ENDPOINT: GET /allotments/details', () => {
    test('should return joined allotment details with member name and locker name -> 200 OK', async () => {
      const res = await request(app).get('/allotments/details');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const record = res.body.find(item => item.allotment_id === allotmentId);
      expect(record).toBeDefined();

      // Verify required fields from prompt:
      // - Allotment ID
      // - Member name
      // - Locker name
      // - Relevant allotment details
      expect(record.allotment_id).toBe(allotmentId);
      expect(record.member_name).toBe('Alice Cooper');
      expect(record.locker_name).toBe('Locker 301');
      expect(record.member_email).toBe('alice@fitnest.com');
      expect(record.locker_floor).toBe(3);
      expect(record.allotment_status).toBe('active');
      expect(record.start_date).toBeDefined();
    });

    test('should return single joined record by ID: GET /allotments/details/:id', async () => {
      const res = await request(app).get(`/allotments/details/${allotmentId}`);
      expect(res.status).toBe(200);
      expect(res.body.allotment_id).toBe(allotmentId);
      expect(res.body.member_name).toBe('Alice Cooper');
      expect(res.body.locker_name).toBe('Locker 301');
    });
  });

  describe('PUT /allotments/:id (Update & Release Locker)', () => {
    test('should complete/return allotment and release locker -> 200 OK', async () => {
      const res = await request(app)
        .put(`/allotments/${allotmentId}`)
        .send({ status: 'returned' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('returned');

      // Verify locker 1 is now available again!
      const checkLocker = await request(app).get(`/lockers/${locker1Id}`);
      expect(checkLocker.body.status).toBe('available');
    });

    test('should allow allotting the newly freed locker to Bob Dylan -> 201 Created', async () => {
      const res = await request(app)
        .post('/allotments')
        .send({
          member_id: member2Id,
          locker_id: locker1Id
        });

      expect(res.status).toBe(201);
      expect(res.body.member_id).toBe(member2Id);
      expect(res.body.locker_id).toBe(locker1Id);
    });
  });

  describe('DELETE /allotments/:id', () => {
    test('should delete an allotment -> 200 OK', async () => {
      const res = await request(app).delete(`/allotments/${allotmentId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const check = await request(app).get(`/allotments/${allotmentId}`);
      expect(check.status).toBe(404);
    });
  });
});

