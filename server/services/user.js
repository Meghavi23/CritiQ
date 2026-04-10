const UserModel = require("../models/user");

const create = (postData) => UserModel.create(postData);

const getAll = (filter) => UserModel.find(filter).lean();

const getOne = (filter) => UserModel.findOne(filter).lean();

const getById = (id) => UserModel.findById(id).lean();

const updateById = (id, payload) => UserModel.findByIdAndUpdate(id, payload, { new: true }).lean();

const UserService = {
    create,
    getAll,
    getOne,
    getById,
    updateById,
}


module.exports = UserService