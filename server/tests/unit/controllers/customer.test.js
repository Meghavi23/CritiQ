jest.mock('../../../services/customer');
jest.mock('diamante-base', () => ({
    Keypair: {
        random: jest.fn(() => ({
            publicKey: () => 'GPUBKEY123',
            secret: () => 'SSECRET123',
        })),
        fromSecret: jest.fn(() => ({
            publicKey: () => 'GPUBKEY123',
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
                    { asset_type: 'credit_alphanum4', balance: '50.0000000' },
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
// node-fetch is dynamically imported; mock the module so it resolves correctly
jest.mock('node-fetch', () => jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ hash: 'friendbot-tx' }),
}), { virtual: false });

const CustomerController = require('../../../controller/customer');
const CustomerService = require('../../../services/customer');

const makeReq = (body = {}, query = {}) => ({ body, params: {}, query });
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

describe('CustomerController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('createCustomer', () => {
        it('should call next with 400 if required fields are missing', async () => {
            const next = jest.fn();
            await CustomerController.createCustomer(makeReq({ name: 'Alice' }), makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });

        it('should call next with 400 if companyEmail is missing', async () => {
            const next = jest.fn();
            await CustomerController.createCustomer(
                makeReq({ name: 'Alice', walletAddress: 'GXXX' }),
                makeRes(),
                next
            );
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });
    });

    describe('loginCustomer', () => {
        it('should call next with 400 if walletAddress is missing', async () => {
            const next = jest.fn();
            await CustomerController.loginCustomer(makeReq({}), makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });

        it('should call next with 401 if customer not found', async () => {
            CustomerService.getOne.mockResolvedValue(null);
            const next = jest.fn();

            await CustomerController.loginCustomer(
                makeReq({ walletAddress: 'GUNKNOWN' }),
                makeRes(),
                next
            );

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        });

        it('should return 200 with customer data when found', async () => {
            const customer = { walletAddress: 'GABC', name: 'Alice' };
            CustomerService.getOne.mockResolvedValue(customer);
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.loginCustomer(makeReq({ walletAddress: 'GABC' }), res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, data: customer })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('getBalance', () => {
        it('should return 200 with all balances as an array', async () => {
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.getBalance(makeReq({}, { pkey: 'GPUBKEY123' }), res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        balances: expect.arrayContaining([
                            expect.objectContaining({ asset_type: 'native', balance: '100.0000000' }),
                        ]),
                    }),
                })
            );
            // Critical: res.json called exactly once (not once per balance item)
            expect(res.json).toHaveBeenCalledTimes(1);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('getAll', () => {
        it('should return 200 with all customers', async () => {
            const customers = [{ name: 'Alice' }, { name: 'Bob' }];
            CustomerService.getAll.mockResolvedValue(customers);
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.getAll(makeReq(), res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, data: customers })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('sendOtp', () => {
        it('should return 200 after sending OTP', async () => {
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.sendOtp(
                makeReq({ email: 'alice@example.com', otp: '123456' }),
                res,
                next
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: expect.stringContaining('OTP') })
            );
        });
    });
});
