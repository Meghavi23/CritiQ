const { wrapAsync } = require("../lib/wrapAsync.js");
const QuestionSet = require("../models/question.js");
const QuestionService = require("../services/question.js");

const create = async (req, res) => {
  const payload = {
    productName: req.body.productName,
    productDescription: req.body.productDescription,
    productImageUrl: req.body.productImageUrl,
    isOrderIdTracking: req.body.isOrderIdTracking,
    reviewDate: req.body.isOrderIdTracking ? req.body.reviewDate : null,
    excelFile: !req.body.isOrderIdTracking ? req.body.excelFile : null,
    questions: req.body.questions,
  };

  const resp = await QuestionService.create(payload);

  res.status(201).send({ data: resp, message: "Form submitted successfully!" });
};

const getById = async (req, res) => {
  const { id } = req.params;

  const questionSet = await QuestionService.getById(id);

  if (!questionSet) {
    return res.status(404).json({ message: "Questions not found" });
  }

  res.json({
    isOrderIdTracking: questionSet.isOrderIdTracking,
    questions: questionSet.questions,
  });
};

const QuestionController = {
  create: wrapAsync(create),
  getById: wrapAsync(getById),
};

module.exports = QuestionController;
