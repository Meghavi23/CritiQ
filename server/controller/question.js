const { wrapAsync } = require('../lib/wrapAsync.js');
const { sendSuccess } = require('../lib/response');
const QuestionService = require('../services/question.js');

const create = async (req, res) => {
    const { productName, productDescription, productImageUrl, isOrderIdTracking, reviewDate, excelFile, questions } = req.body;

    const payload = {
        productName,
        productDescription,
        productImageUrl,
        isOrderIdTracking,
        reviewDate: isOrderIdTracking ? reviewDate : null,
        excelFile: !isOrderIdTracking ? excelFile : null,
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
