// fastwinston lazily requires `competion` (a compression package) which fires
// async dynamic imports after each request and causes Jest teardown errors.
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
const User = require('../../models/User');

beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clear(); });
afterAll(async () => { await db.disconnect(); });

const validUser = {
    companyName: 'TestCo',
    companyEmail: 'testco@example.com',
    walletAddress: 'GABC123456789XYZ',
    companyDescription: 'A company for testing',
    companyLogoUrl: 'https://img.example.com/logo.png',
};

describe('POST /api/users/signup', () => {
    it('should return 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/users/signup')
            .send({ companyName: 'TestCo' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Missing required fields/i);
    });

    it('should create a user and return 201 on valid input', async () => {
        const res = await request(app)
            .post('/api/users/signup')
            .send(validUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/signup successful/i);

        const saved = await User.findOne({ walletAddress: validUser.walletAddress });
        expect(saved).not.toBeNull();
        expect(saved.name).toBe(validUser.companyName);
    });

    it('should return 409 on duplicate email or walletAddress', async () => {
        await request(app).post('/api/users/signup').send(validUser);

        const res = await request(app)
            .post('/api/users/signup')
            .send(validUser);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });
});

describe('POST /api/users/login', () => {
    it('should return 400 if walletAddress is missing', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 if wallet address is not registered', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({ walletAddress: 'GUNREGISTERED' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 with user data for a registered wallet', async () => {
        // Seed a user directly
        await User.create({
            name: validUser.companyName,
            email: validUser.companyEmail,
            imageUrl: validUser.companyLogoUrl,
            description: validUser.companyDescription,
            walletAddress: validUser.walletAddress,
            type: 'COMPANY',
        });

        const res = await request(app)
            .post('/api/users/login')
            .send({ walletAddress: validUser.walletAddress });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ walletAddress: validUser.walletAddress });
    });
});
