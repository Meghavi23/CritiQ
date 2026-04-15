const Router = require('express').Router;
const rateLimit = require('express-rate-limit');
const CustomerController = require('../controller/customer');
const validate = require('../middlewares/validate');
const {
    createCustomerSchema,
    loginCustomerSchema,
    sendOtpSchema,
    sendMoneySchema,
    getBalanceSchema,
} = require('../lib/validators/customer');

const router = Router();

const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const otpLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many OTP requests. Please try again later.' },
});

router.post('/create',    validate(createCustomerSchema),           CustomerController.createCustomer);
router.post('/login',     loginLimit, validate(loginCustomerSchema), CustomerController.loginCustomer);
router.post('/sendotp',   otpLimit,   validate(sendOtpSchema),       CustomerController.sendOtp);
router.post('/sendmoney', loginLimit, validate(sendMoneySchema),     CustomerController.sendMoney);

router.get('/getbalance', validate(getBalanceSchema, 'query'),       CustomerController.getBalance);
router.get('/getall',                                                 CustomerController.getAll);

module.exports = router;
