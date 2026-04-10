const QuestionSetModel = require("../models/question");

const create = (postData) => QuestionSetModel.create(postData);

const getAll = (filter) => QuestionSetModel.find(filter).lean();

const getOne = (filter) => QuestionSetModel.findOne(filter).lean();

const getById = (id) => QuestionSetModel.findById(id).lean();

const updateById = (id, payload) => QuestionSetModel.findByIdAndUpdate(id, payload, { new: true }).lean();

const QuestionService = {
    create,
    getAll,
    getOne,
    getById,
    updateById,
}


module.exports = QuestionService