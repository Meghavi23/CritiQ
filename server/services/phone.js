const PhoneModel = require("../models/phone");

const create = (postData) => PhoneModel.create(postData);

const getAll = (filter) => PhoneModel.find(filter).lean();

const getOne = (filter) => PhoneModel.findOne(filter).lean();

const getById = (id) => PhoneModel.findById(id).lean();

const updateById = (id, payload) => PhoneModel.findByIdAndUpdate(id, payload, { new: true }).lean();

const PhoneService = {
    create,
    getAll,
    getOne,
    getById,
    updateById,
}


module.exports = PhoneService