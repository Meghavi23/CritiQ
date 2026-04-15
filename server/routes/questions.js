const express = require('express');
const QuestionController = require('../controller/question');
const validate = require('../middlewares/validate');
const { createQuestionSetSchema } = require('../lib/validators/question');

const router = express.Router();

router.post('/', validate(createQuestionSetSchema), QuestionController.create);
router.get('/:id',                                  QuestionController.getById);

module.exports = router;
