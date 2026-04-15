const { wrapAsync } = require('../lib/wrapAsync.js');
const { sendSuccess } = require('../lib/response');
const QuestionService = require('../services/question.js');

const create = async (req, res) => {
    const { productName, productDescription, productImageUrl, isOrderIdTracking, questions } = req.body;

    if (!productName || !productDescription || !productImageUrl || isOrderIdTracking === undefined || !Array.isArray(questions) || questions.length === 0) {
        const err = new Error('Missing required fields: productName, productDescription, productImageUrl, isOrderIdTracking, questions (array)');
        err.statusCode = 400;
        throw err;
    }

    const payload = {
        productName,
        productDescription,
        productImageUrl,
        isOrderIdTracking,
        reviewDate: isOrderIdTracking ? req.body.reviewDate : null,
        excelFile: !isOrderIdTracking ? req.body.excelFile : null,
        questions,
    };

    const resp = await QuestionService.create(payload);

    return sendSuccess(res, { message: 'Form submitted successfully!', data: resp, statusCode: 201 });
};

const getById = async (req, res) => {
    const questionSet = await QuestionService.getById(req.params.id);

    if (!questionSet) {
        const err = new Error('Questions not found');
        err.statusCode = 404;
        throw err;
    }

    return sendSuccess(res, {
        message: 'Questions fetched successfully',
        data: {
            isOrderIdTracking: questionSet.isOrderIdTracking,
            questions: questionSet.questions,
        },
    });
};

const QuestionController = {
    create: wrapAsync(create),
    getById: wrapAsync(getById),
};

module.exports = QuestionController;
