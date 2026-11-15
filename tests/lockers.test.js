const request = require('supertest');
const app = require('../src/app');
const { getDatabase, close } = require('../src/database/connection');
const { initDatabase } = require('../src/database/init');

describe('Lockers API Endpoints', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const db = getDatabase(':memory:');
    await initDatabase(db);
  });

  afterAll(async () => {
    await close();
  });

  let createdLockerId;

  describe('POST /lockers (Validation & Creation)', () => {
    test('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/lockers')
        .send({ floor: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/name is required/i);
    });

    test('should return 400 if floor is missing or invalid', async () => {
      const res = await request(app)
        .post('/lockers')
        .send({ name: 'Locker A' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/floor is required/i);
    });

    test('should return 400 if status is invalid', async () => {
      const res = await request(app)
        .post('/lockers')
        .send({ name: 'Locker A', floor: 1, status: 'broken' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/status must be one of/i);
    });

    test('should create a valid locker -> 201 Created', async () => {
      const res = await request(app)
        .post('/lockers')
        .send({ name: 'Locker 101', floor: 1, status: 'available' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Locker 101');
      expect(res.body.floor).toBe(1);
      expect(res.body.status).toBe('available');
      createdLockerId = res.body.id;
    });

    test('should create another locker on floor 2', async () => {
      const res = await request(app)
        .post('/lockers')
        .send({ name: 'Locker 201', floor: 2 });
      expect(res.status).toBe(201);
      expect(res.body.floor).toBe(2);
    });

    test('should create a third locker on floor 2', async () => {
      const res = await request(app)
        .post('/lockers')
        .send({ name: 'Locker 202', floor: 2 });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /lockers (Retrieval & Search)', () => {
    test('should retrieve all lockers -> 200 OK', async () => {
      const res = await request(app).get('/lockers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    test('should search lockers by floor: GET /lockers?floor=2', async () => {
      const res = await request(app).get('/lockers?floor=2');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      res.body.forEach(locker => {
        expect(locker.floor).toBe(2);
      });
    });

    test('should search lockers by status: GET /lockers?status=available', async () => {
      const res = await request(app).get('/lockers?status=available');
      expect(res.status).toBe(200);
      res.body.forEach(locker => {
        expect(locker.status).toBe('available');
      });
    });

    test('should search lockers by name keyword: GET /lockers?search=201', async () => {
      const res = await request(app).get('/lockers?search=201');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Locker 201');
    });
  });

  describe('GET /lockers/:id', () => {
    test('should retrieve a single locker by ID -> 200 OK', async () => {
      const res = await request(app).get(`/lockers/${createdLockerId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdLockerId);
      expect(res.body.name).toBe('Locker 101');
    });

    test('should return 404 for non-existent locker ID', async () => {
      const res = await request(app).get('/lockers/9999');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test('should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/lockers/abc');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be a positive integer/i);
    });
  });

  describe('PUT /lockers/:id', () => {
    test('should update locker details -> 200 OK', async () => {
      const res = await request(app)
        .put(`/lockers/${createdLockerId}`)
        .send({ floor: 3 });
      expect(res.status).toBe(200);
      expect(res.body.floor).toBe(3);
    });

    test('should return 404 when updating non-existent locker', async () => {
      const res = await request(app)
        .put('/lockers/9999')
        .send({ floor: 2 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /lockers/:id', () => {
    test('should delete an available locker -> 200 OK', async () => {
      const res = await request(app).delete(`/lockers/${createdLockerId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Verify it is gone
      const checkRes = await request(app).get(`/lockers/${createdLockerId}`);
      expect(checkRes.status).toBe(404);
    });

    test('should return 404 when deleting already deleted or non-existent locker', async () => {
      const res = await request(app).delete(`/lockers/${createdLockerId}`);
      expect(res.status).toBe(404);
    });
  });
});

