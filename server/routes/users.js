const rateLimit = require('express-rate-limit');
const UserController = require('../controller/user');

const router = require('express').Router();

const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/signup', UserController.create);
router.post('/login',  loginLimit, UserController.login);

module.exports = router;
