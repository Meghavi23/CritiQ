const { wrapAsync } = require('../lib/wrapAsync.js');
const { sendSuccess } = require('../lib/response');
const PhoneService = require('../services/phone.js');

const create = async (req, res) => {
    const { sid, id, phone } = req.body;

    if (!phone || !sid || id === undefined) {
        const err = new Error('Missing required fields: phone, sid, id');
        err.statusCode = 400;
        throw err;
    }

    await PhoneService.create({ sid, id, phone });

    return sendSuccess(res, { message: 'Phone added successfully' });
};

const getOne = async (req, res) => {
    const { phone } = req.query;

    const data = await PhoneService.getOne({ phone });

    if (!data) {
        const err = new Error('Phone not found');
        err.statusCode = 404;
        throw err;
    }

    return sendSuccess(res, { message: 'Phone record found', data });
};

const PhoneController = {
    create: wrapAsync(create),
    getOne: wrapAsync(getOne),
};

module.exports = PhoneController;
