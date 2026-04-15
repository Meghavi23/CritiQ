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
const QuestionSet = require('../../models/question');

beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clear(); });
afterAll(async () => { await db.disconnect(); });

const validPayload = {
    productName: 'Laptop Pro',
    productDescription: 'A high-end laptop',
    productImageUrl: 'https://img.example.com/laptop.png',
    isOrderIdTracking: true,
    reviewDate: '2026-06-01',
    questions: [
        { type: 'SHORT', q: 'How was the build quality?' },
        { type: 'MCQ', q: 'Would you recommend it?', options: ['Yes', 'No', 'Maybe'] },
    ],
};

describe('POST /api/questions', () => {
    it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/questions')
            .send({ productName: 'Laptop Pro' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/missing required fields/i);
    });

    it('should return 400 if questions is not an array or is empty', async () => {
        const res = await request(app)
            .post('/api/questions')
            .send({ ...validPayload, questions: [] });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should create a question set and return 201', async () => {
        const res = await request(app)
            .post('/api/questions')
            .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ productName: 'Laptop Pro' });

        const saved = await QuestionSet.findOne({ productName: 'Laptop Pro' });
        expect(saved).not.toBeNull();
        expect(saved.questions).toHaveLength(2);
    });
});

describe('GET /api/questions/:id', () => {
    it('should return 400 for an invalid MongoDB ObjectId', async () => {
        const res = await request(app).get('/api/questions/not-a-valid-id');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 404 if question set does not exist', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await request(app).get(`/api/questions/${fakeId}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 with question set data when found', async () => {
        const created = await QuestionSet.create(validPayload);

        const res = await request(app).get(`/api/questions/${created._id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            isOrderIdTracking: true,
            questions: expect.arrayContaining([
                expect.objectContaining({ q: 'How was the build quality?' }),
            ]),
        });
    });
});
