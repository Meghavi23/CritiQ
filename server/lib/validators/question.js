const Joi = require('joi');
const CONSTANTS = require('../contants');

const questionTypes = Object.values(CONSTANTS.QUESTION_TYPE);

const questionSchema = Joi.object({
    q: Joi.string().trim().min(1).required(),
    type: Joi.string().valid(...questionTypes).required(),
    options: Joi.when('type', {
        is: CONSTANTS.QUESTION_TYPE.MCQ,
        then: Joi.array().items(Joi.string()).min(2).required().messages({
            'array.min': 'MCQ questions must have at least 2 options',
        }),
        otherwise: Joi.array().items(Joi.string()).default([]),
    }),
});

const createQuestionSetSchema = Joi.object({
    productName: Joi.string().trim().min(1).max(200).required(),
    productDescription: Joi.string().trim().min(1).max(1000).required(),
    productImageUrl: Joi.string().uri().required(),
    isOrderIdTracking: Joi.boolean().required(),
    reviewDate: Joi.when('isOrderIdTracking', {
        is: true,
        then: Joi.date().iso().optional(),
        otherwise: Joi.any().strip(),
    }),
    excelFile: Joi.when('isOrderIdTracking', {
        is: false,
        then: Joi.string().optional(),
        otherwise: Joi.any().strip(),
    }),
    questions: Joi.array().items(questionSchema).min(1).required().messages({
        'array.min': 'At least one question is required',
    }),
});

module.exports = {
    createQuestionSetSchema,
};
