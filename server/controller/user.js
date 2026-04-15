const { wrapAsync } = require('../lib/wrapAsync.js');
const { sendSuccess } = require('../lib/response');
const CONSTANTS = require('../lib/contants');
const UserService = require('../services/user.js');

const create = async (req, res) => {
    const { companyName, companyEmail, walletAddress, companyDescription, companyLogoUrl } = req.body;

    if (!companyName || !companyEmail || !walletAddress || !companyDescription || !companyLogoUrl) {
        const err = new Error('Missing required fields: companyName, companyEmail, walletAddress, companyDescription, companyLogoUrl');
        err.statusCode = 400;
        throw err;
    }

    await UserService.create({
        name: companyName,
        email: companyEmail,
        imageUrl: companyLogoUrl,
        description: companyDescription,
        walletAddress,
        type: CONSTANTS.USER_ROLE.COMPANY,
    });

    return sendSuccess(res, { message: 'Signup successful!', statusCode: 201 });
};

const login = async (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        const err = new Error('walletAddress is required');
        err.statusCode = 400;
        throw err;
    }

    const user = await UserService.getOne({ walletAddress });

    if (!user) {
        const err = new Error('Wallet address not found. Please sign up first.');
        err.statusCode = 401;
        throw err;
    }

    return sendSuccess(res, { message: 'Login successful!', data: user });
};

const UserController = {
    create: wrapAsync(create),
    login: wrapAsync(login),
};

module.exports = UserController;
