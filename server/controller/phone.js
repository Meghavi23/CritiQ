const { wrapAsync } = require("../lib/wrapAsync.js");
const PhoneService = require("../services/phone.js");

const create = async (req, res) => {
  const { sid, id, phone } = req.body;

  const resp = await PhoneService.create({ sid, id, phone });

  res.status(200).json({ message: "Phone added successfully", status: 1 });
};

const getOne = async (req, res) => {
  const phone = req.query.phone;

  const data = await PhoneService.getOne({ phone: phone });

  if (!data) {
    res.status(200).json({ status: 0 });
  } else {
    res.status(200).json({ status: 1, data: data });
  }
};

const PhoneController = {
  create: wrapAsync(create),
  getOne: wrapAsync(getOne),
};

module.exports = PhoneController;
