// Validation is now handled by the validate middleware (not the controller).
// Unit tests mock the service layer and verify controller logic only.
jest.mock('../../../services/customer');

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
        it('should delegate to CustomerService.createWithWallet and return 201', async () => {
            CustomerService.createWithWallet.mockResolvedValue({});
            const body = { name: 'Alice', companyEmail: 'alice@example.com', walletAddress: 'GALICE' };
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.createCustomer(makeReq(body), res, next);

            expect(CustomerService.createWithWallet).toHaveBeenCalledWith(body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: expect.stringContaining('Signup') })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next if CustomerService.createWithWallet throws', async () => {
            const dbError = new Error('DB error');
            CustomerService.createWithWallet.mockRejectedValue(dbError);
            const next = jest.fn();

            await CustomerController.createCustomer(makeReq({ name: 'Alice' }), makeRes(), next);

            expect(next).toHaveBeenCalledWith(dbError);
        });
    });

    describe('loginCustomer', () => {
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

            expect(CustomerService.getOne).toHaveBeenCalledWith({ walletAddress: 'GABC' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, data: customer })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('getBalance', () => {
        it('should delegate to CustomerService.fetchBalance and return 200 with balances', async () => {
            const mockBalances = [
                { asset_type: 'native', balance: '100.0000000' },
                { asset_type: 'credit_alphanum4', balance: '50.0000000' },
            ];
            CustomerService.fetchBalance.mockResolvedValue(mockBalances);
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.getBalance(makeReq({}, { pkey: 'GPUBKEY123' }), res, next);

            expect(CustomerService.fetchBalance).toHaveBeenCalledWith('GPUBKEY123');
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
            expect(res.json).toHaveBeenCalledTimes(1);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('sendOtp', () => {
        it('should delegate to CustomerService.sendOTPEmail and return 200', async () => {
            CustomerService.sendOTPEmail.mockResolvedValue({});
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.sendOtp(
                makeReq({ email: 'alice@example.com', otp: '123456' }),
                res,
                next
            );

            expect(CustomerService.sendOTPEmail).toHaveBeenCalledWith('alice@example.com', '123456');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: expect.stringContaining('OTP') })
            );
        });
    });

    describe('sendMoney', () => {
        it('should delegate to CustomerService.executePayment and return 200 with payment info', async () => {
            CustomerService.executePayment.mockResolvedValue({
                amount: '1',
                destination: 'GDEST123',
                sender: 'GSEND123',
            });
            const res = makeRes();
            const next = jest.fn();

            await CustomerController.sendMoney(makeReq({ key: 'GDEST123' }), res, next);

            expect(CustomerService.executePayment).toHaveBeenCalledWith('GDEST123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('DIAM'),
                })
            );
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
});
