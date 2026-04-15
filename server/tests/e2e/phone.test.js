jest.mock('fastwinston', () => ({}));
jest.mock('express-compression', () => () => (req, res, next) => next());

// Mock file-IO / DB-logging middleware to avoid noise in tests
jest.mock('../../middlewares/logger.js', () => ({
    expressLogger: (req, res, next) => next(),
    expressErrorLogger: (err, req, res, next) => next(err),
}));
jest.mock('../../middlewares/logs.js', () => ({
    createUserApiLog: jest.fn(),
    auditPersonJson: jest.fn(),
}));

const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');
const Phone = require('../../models/phone');

beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clear(); });
afterAll(async () => { await db.disconnect(); });

describe('POST /api/phone', () => {
    it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/phone')
            .send({ phone: '9876543210' }); // missing sid and id

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/missing required fields/i);
    });

    it('should create a phone record and return 200', async () => {
        const res = await request(app)
            .post('/api/phone')
            .send({ phone: '9876543210', sid: 42, id: 1 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/phone added/i);

        const saved = await Phone.findOne({ phone: '9876543210' });
        expect(saved).not.toBeNull();
    });
});

describe('GET /api/phone', () => {
    it('should return 404 if phone number is not found', async () => {
        const res = await request(app)
            .get('/api/phone')
            .query({ phone: '0000000000' });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 with phone record when found', async () => {
        await Phone.create({ phone: '9876543210', sid: 42, id: 1 });

        const res = await request(app)
            .get('/api/phone')
            .query({ phone: '9876543210' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ phone: '9876543210' });
    });
});
