// Mock external blockchain and email services
jest.mock('diamante-base', () => ({
    Keypair: {
        random: jest.fn(() => ({
            publicKey: () => 'GPUBKEY123TESTONLY',
            secret: () => 'SSECRET123TESTONLY',
        })),
        fromSecret: jest.fn(() => ({
            publicKey: () => 'GPUBKEY123TESTONLY',
        })),
    },
    TransactionBuilder: jest.fn().mockImplementation(() => ({
        addOperation: jest.fn().mockReturnThis(),
        setTimeout: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ sign: jest.fn() }),
    })),
    Operation: { payment: jest.fn() },
    Networks: { TESTNET: 'Test SDF Network ; September 2015' },
}));
jest.mock('diamante-sdk-js', () => ({
    Horizon: {
        Server: jest.fn().mockImplementation(() => ({
            loadAccount: jest.fn().mockResolvedValue({
                balances: [
                    { asset_type: 'native', balance: '100.0000000' },
                ],
            }),
            fetchBaseFee: jest.fn().mockResolvedValue(100),
            submitTransaction: jest.fn().mockResolvedValue({ hash: 'txhash123' }),
        })),
    },
    Asset: { native: jest.fn() },
}));
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn((opts, cb) => cb(null, { response: '250 OK' })),
    }),
}));
jest.mock('node-fetch', () => jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ hash: 'friendbot-tx' }),
}));

jest.mock('fastwinston', () => ({}));
jest.mock('express-compression', () => () => (req, res, next) => next());

// Mock file-IO / DB-logging middleware
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
const Customer = require('../../models/customer');

beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clear(); });
afterAll(async () => { await db.disconnect(); });

const seedCustomer = (overrides = {}) =>
    Customer.create({
        name: 'Alice',
        email: 'alice@example.com',
        walletAddress: 'GALICE123456789',
        type: 'user',
        pkey: 'GPUBKEY123',
        skey: 'SSECRET123',
        ...overrides,
    });

describe('POST /api/customers/login', () => {
    it('should return 400 if walletAddress is missing', async () => {
        const res = await request(app).post('/api/customers/login').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 if wallet address is not registered', async () => {
        const res = await request(app)
            .post('/api/customers/login')
            .send({ walletAddress: 'GUNREGISTERED999' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 with customer data for a registered wallet', async () => {
        await seedCustomer();

        const res = await request(app)
            .post('/api/customers/login')
            .send({ walletAddress: 'GALICE123456789' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ walletAddress: 'GALICE123456789' });
    });
});

describe('GET /api/customers/getall', () => {
    it('should return 200 with empty array when no customers exist', async () => {
        const res = await request(app).get('/api/customers/getall');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
    });

    it('should return 200 with all seeded customers', async () => {
        await seedCustomer();
        await seedCustomer({ name: 'Bob', email: 'bob@example.com', walletAddress: 'GBOB999' });

        const res = await request(app).get('/api/customers/getall');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
    });
});

describe('GET /api/customers/getbalance', () => {
    it('should return 200 with balances array (mocked blockchain)', async () => {
        const res = await request(app)
            .get('/api/customers/getbalance')
            .query({ pkey: 'GPUBKEY123TESTONLY' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.balances).toBeInstanceOf(Array);
        expect(res.body.data.balances[0]).toMatchObject({
            asset_type: 'native',
            balance: '100.0000000',
        });
    });
});

describe('POST /api/customers/sendotp', () => {
    it('should return 200 after sending OTP (mocked nodemailer)', async () => {
        const res = await request(app)
            .post('/api/customers/sendotp')
            .send({ email: 'alice@example.com', otp: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/otp sent/i);
    });
});

describe('POST /api/customers/sendmoney', () => {
    it('should return 200 on successful payment (mocked blockchain)', async () => {
        const res = await request(app)
            .post('/api/customers/sendmoney')
            .send({ key: 'GDEST999RECIPIENT' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/diam/i);
    });
});
