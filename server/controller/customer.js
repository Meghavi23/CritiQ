const { wrapAsync } = require('../lib/wrapAsync');
const { sendSuccess } = require('../lib/response');
const CustomerService = require('../services/customer');

const createCustomer = async (req, res) => {
    await CustomerService.createWithWallet(req.body);
    return sendSuccess(res, { message: 'Signup successful!', statusCode: 201 });
};

const loginCustomer = async (req, res) => {
    const user = await CustomerService.getOne({ walletAddress: req.body.walletAddress });

    if (!user) {
        const err = new Error('Wallet address not found. Please sign up first.');
        err.statusCode = 401;
        throw err;
    }

    return sendSuccess(res, { message: 'Login successful!', data: user });
};

const sendOtp = async (req, res) => {
    const { email, otp } = req.body;
    await CustomerService.sendOTPEmail(email, otp);
    return sendSuccess(res, { message: 'OTP sent successfully!' });
};

const getBalance = async (req, res) => {
    const balances = await CustomerService.fetchBalance(req.query.pkey);
    return sendSuccess(res, { message: 'Balance fetched', data: { balances } });
};

const sendMoney = async (req, res) => {
    const result = await CustomerService.executePayment(req.body.key);
    return sendSuccess(res, {
        message: `Payment of ${result.amount} DIAM made to ${result.destination} successfully`,
    });
};

const getAll = async (_req, res) => {
    const customers = await CustomerService.getAll();
    return sendSuccess(res, { message: 'Customers fetched', data: customers });
};

const CustomerController = {
    createCustomer: wrapAsync(createCustomer),
    loginCustomer: wrapAsync(loginCustomer),
    sendOtp: wrapAsync(sendOtp),
    sendMoney: wrapAsync(sendMoney),
    getBalance: wrapAsync(getBalance),
    getAll: wrapAsync(getAll),
};

module.exports = CustomerController;
