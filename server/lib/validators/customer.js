const Joi = require('joi');

const walletAddress = Joi.string().alphanum().length(56).required();

const createCustomerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    companyEmail: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
    walletAddress,
});

const loginCustomerSchema = Joi.object({
    walletAddress,
});

const sendOtpSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
    otp: Joi.string().pattern(/^\d{4,8}$/).required().messages({
        'string.pattern.base': 'otp must be a 4-8 digit number',
    }),
});

const sendMoneySchema = Joi.object({
    key: walletAddress,
});

const getBalanceSchema = Joi.object({
    pkey: walletAddress,
});

module.exports = {
    createCustomerSchema,
    loginCustomerSchema,
    sendOtpSchema,
    sendMoneySchema,
    getBalanceSchema,
};
