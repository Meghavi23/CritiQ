const CustomerModel = require("../models/customer");

const create = (postData) => CustomerModel.create(postData);

const getAll = (filter) => CustomerModel.find(filter).lean();

const getOne = (filter) => CustomerModel.findOne(filter).lean();

const getById = (id) => CustomerModel.findById(id).lean();

const updateById = (id, payload) => CustomerModel.findByIdAndUpdate(id, payload, { new: true }).lean();

const CustomerService = {
    create,
    getAll,
    getOne,
    getById,
    updateById,
}


module.exports = CustomerService