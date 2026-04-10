const mongoose = require('mongoose');
const CONSTANTS = require('../lib/contants');
const Schema = mongoose.Schema;

// Define the schema for a question
const QuestionSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(CONSTANTS.QUESTION_TYPE),
    required: true
  },
  q: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    default: []
  }
});

// Define the schema for the question set form
const QuestionSetSchema = new Schema({
  productName: {
    type: String,
    required: true
  },
  productDescription: {
    type: String,
    required: true
  },
  productImageUrl: {
    type: String,
    required: true
  },
  isOrderIdTracking: {
    type: Boolean,
    required: true
  },
  reviewDate: {
    type: Date
  },
  excelFile: {
    type: String
  },
  questions: [QuestionSchema]
}, { timestamps: true });

const QuestionSetModel = mongoose.model('QuestionSet', QuestionSetSchema);
module.exports = QuestionSetModel;
