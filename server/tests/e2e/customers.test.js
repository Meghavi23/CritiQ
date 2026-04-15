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
                balances: [{ asset_type: 'native', balance: '100.0000000' }],
            }),
            fetchBaseFee: jest.fn().mockResolvedValue(100),
            submitTransaction: jest.fn().mockResolvedValue({ hash: 'txhash123' }),
        })),
    },
    Asset: { native: jest.fn() },
}));
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn((_opts, cb) => cb(null, { response: '250 OK' })),
    }),
}));
jest.mock('node-fetch', () => jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ hash: 'friendbot-tx' }),
}));

jest.mock('fastwinston', () => ({}));
jest.mock('express-compression', () => () => (_req, _res, next) => next());

jest.mock('../../middlewares/logger.js', () => ({
    expressLogger: (_req, _res, next) => next(),
    expressErrorLogger: (err, _req, _res, next) => next(err),
}));
jest.mock('../../middlewares/logs.js', () => ({
    createUserApiLog: jest.fn(),
    auditPersonJson: jest.fn(),
}));

const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');
const Customer = require('../../models/customer');

beforeAll(async () => {
    await db.connect();
    // Mongoose v8 builds indexes lazily. Wait for them before running tests that
    // depend on unique constraints (e.g., the 409 duplicate-wallet test).
    await Customer.init();
});
afterEach(async () => { await db.clear(); });
afterAll(async () => { await db.disconnect(); });;

// Joi requires walletAddress to be exactly 56 alphanumeric characters.
const VALID_WALLET = 'A'.repeat(56);
const VALID_WALLET_2 = 'B'.repeat(56);

// Seeds a customer directly into the DB (bypasses API validation).
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

// ─── POST /api/customers/create ──────────────────────────────────────────────

describe('POST /api/customers/create', () => {
    it('should return 400 if name is missing', async () => {
        const res = await request(app)
            .post('/api/customers/create')
            .send({ companyEmail: 'alice@example.com', walletAddress: VALID_WALLET });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if companyEmail has an invalid format', async () => {
        const res = await request(app)
            .post('/api/customers/create')
            .send({ name: 'Alice', companyEmail: 'not-an-email', walletAddress: VALID_WALLET });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if walletAddress is not 56 characters', async () => {
        const res = await request(app)
            .post('/api/customers/create')
            .send({ name: 'Alice', companyEmail: 'alice@example.com', walletAddress: 'TOOSHORT' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 409 if walletAddress is already registered', async () => {
        // First registration succeeds
        await request(app).post('/api/customers/create').send({
            name: 'Alice',
            companyEmail: 'alice@example.com',
            walletAddress: VALID_WALLET,
        });

        // Second registration with the same walletAddress must conflict
        const res = await request(app).post('/api/customers/create').send({
            name: 'Bob',
            companyEmail: 'bob@example.com',
            walletAddress: VALID_WALLET,
        });
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it('should return 201 on successful customer creation', async () => {
        const res = await request(app)
            .post('/api/customers/create')
            .send({ name: 'Alice', companyEmail: 'alice@example.com', walletAddress: VALID_WALLET });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/signup successful/i);
    });
});

// ─── POST /api/customers/login ───────────────────────────────────────────────

describe('POST /api/customers/login', () => {
    it('should return 400 if walletAddress is missing', async () => {
        const res = await request(app).post('/api/customers/login').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if walletAddress is not 56 characters', async () => {
        const res = await request(app)
            .post('/api/customers/login')
            .send({ walletAddress: 'TOOSHORT' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 if wallet address is not registered', async () => {
        const res = await request(app)
            .post('/api/customers/login')
            .send({ walletAddress: VALID_WALLET });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 with customer data for a registered wallet', async () => {
        await seedCustomer({ walletAddress: VALID_WALLET });

        const res = await request(app)
            .post('/api/customers/login')
            .send({ walletAddress: VALID_WALLET });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ walletAddress: VALID_WALLET });
    });
});

// ─── POST /api/customers/sendotp ─────────────────────────────────────────────

describe('POST /api/customers/sendotp', () => {
    it('should return 400 if email is missing', async () => {
        const res = await request(app)
            .post('/api/customers/sendotp')
            .send({ otp: '123456' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if email has an invalid format', async () => {
        const res = await request(app)
            .post('/api/customers/sendotp')
            .send({ email: 'not-an-email', otp: '123456' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if otp is missing', async () => {
        const res = await request(app)
            .post('/api/customers/sendotp')
            .send({ email: 'alice@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if otp is not numeric', async () => {
        const res = await request(app)
            .post('/api/customers/sendotp')
            .send({ email: 'alice@example.com', otp: 'abcd' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 after sending OTP (mocked nodemailer)', async () => {
        const res = await request(app)
            .post('/api/customers/sendotp')
            .send({ email: 'alice@example.com', otp: '123456' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/otp sent/i);
    });
});

// ─── POST /api/customers/sendmoney ───────────────────────────────────────────

describe('POST /api/customers/sendmoney', () => {
    it('should return 400 if key is missing', async () => {
        const res = await request(app).post('/api/customers/sendmoney').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if key is not 56 characters', async () => {
        const res = await request(app)
            .post('/api/customers/sendmoney')
            .send({ key: 'TOOSHORT' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 on successful payment (mocked blockchain)', async () => {
        const res = await request(app)
            .post('/api/customers/sendmoney')
            .send({ key: VALID_WALLET_2 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/diam/i);
    });
});

// ─── GET /api/customers/getbalance ───────────────────────────────────────────

describe('GET /api/customers/getbalance', () => {
    it('should return 400 if pkey query param is missing', async () => {
        const res = await request(app).get('/api/customers/getbalance');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 400 if pkey is not 56 characters', async () => {
        const res = await request(app)
            .get('/api/customers/getbalance')
            .query({ pkey: 'TOOSHORT' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 200 with balances array (mocked blockchain)', async () => {
        const res = await request(app)
            .get('/api/customers/getbalance')
            .query({ pkey: VALID_WALLET });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.balances).toBeInstanceOf(Array);
        expect(res.body.data.balances[0]).toMatchObject({
            asset_type: 'native',
            balance: '100.0000000',
        });
    });
});

// ─── GET /api/customers/getall ───────────────────────────────────────────────

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

// ─── Response includes correlation ID header ──────────────────────────────────

describe('X-Correlation-Id header', () => {
    it('should be present on every response', async () => {
        const res = await request(app).get('/api/customers/getall');
        expect(res.headers['x-correlation-id']).toBeDefined();
        expect(res.headers['x-correlation-id']).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
    });
});
