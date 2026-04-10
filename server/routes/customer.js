const Router = require('express').Router;
const CustomerController = require('../controller/customer');
const { createCustomer, loginCustomer, sendOtp, getBalance, sendMoney, getAll } = require('../controller/customer');

const router = Router();

router.post('/create', CustomerController.createCustomer);
router.post('/login', CustomerController.loginCustomer);
router.post('/sendotp', CustomerController.sendOtp);
router.post('/sendmoney', CustomerController.sendMoney);

router.get('/getbalance', CustomerController.getBalance);
router.get('/getall', CustomerController.getAll);

module.exports = router;
