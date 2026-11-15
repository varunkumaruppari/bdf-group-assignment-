const request = require('supertest');
const app = require('../src/app');
const { getDatabase, close } = require('../src/database/connection');
const { initDatabase } = require('../src/database/init');

describe('Members API Endpoints', () => {
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

  describe('POST /members', () => {
    test('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/members')
        .send({ email: 'test@gym.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/name is required/i);
    });

    test('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/members')
        .send({ name: 'John Doe', email: 'invalid-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid email/i);
    });

    test('should create a valid member -> 201 Created', async () => {
      const res = await request(app)
        .post('/members')
        .send({
          name: 'John Doe',
          email: 'john.doe@gym.com',
          phone: '123-456-7890',
          membership_type: 'Premium'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('John Doe');
      expect(res.body.email).toBe('john.doe@gym.com');
      expect(res.body.membership_type).toBe('Premium');
      member1Id = res.body.id;
    });

    test('should reject duplicate email (case-insensitive) -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/members')
        .send({
          name: 'Another John',
          email: 'JOHN.DOE@GYM.COM'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    test('should create a second member -> 201 Created', async () => {
      const res = await request(app)
        .post('/members')
        .send({
          name: 'Jane Smith',
          email: 'jane.smith@gym.com',
          phone: '987-654-3210'
        });

      expect(res.status).toBe(201);
      member2Id = res.body.id;
    });
  });

  describe('GET /members', () => {
    test('should return list of all members -> 200 OK', async () => {
      const res = await request(app).get('/members');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    test('should return a single member by ID -> 200 OK', async () => {
      const res = await request(app).get(`/members/${member1Id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('John Doe');
    });

    test('should return 404 for non-existent member ID', async () => {
      const res = await request(app).get('/members/9999');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('PUT /members/:id', () => {
    test('should update member details -> 200 OK', async () => {
      const res = await request(app)
        .put(`/members/${member1Id}`)
        .send({ name: 'Johnathon Doe', phone: '111-222-3333' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Johnathon Doe');
      expect(res.body.phone).toBe('111-222-3333');
    });

    test('should prevent updating email to another member email -> 409 Conflict', async () => {
      const res = await request(app)
        .put(`/members/${member2Id}`)
        .send({ email: 'john.doe@gym.com' });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already in use/i);
    });
  });

  describe('DELETE /members/:id', () => {
    test('should delete member without active allotment -> 200 OK', async () => {
      const res = await request(app).delete(`/members/${member2Id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const check = await request(app).get(`/members/${member2Id}`);
      expect(check.status).toBe(404);
    });
  });
});

