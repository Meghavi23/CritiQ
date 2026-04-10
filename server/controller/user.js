const { wrapAsync } = require("../lib/wrapAsync.js");
const UserService = require("../services/user.js");

const create = async (req, res) => {
  const payload = {
    name: req.body.companyName,
    email: req.body.companyEmail,
    imageUrl: req.body.companyLogoUrl,
    description: req.body.companyDescription,
    walletAddress: req.body.walletAddress,
    type: CONSTANTS.USER_ROLE.COMPANY,
  };

  const resp = await UserService.create(payload);

  res.status(200).json({ message: "Signup successful!" });
};

const login = async (req, res) => {
  const wallet = req.body.walletAddress;

  const user = await UserService.getOne({ walletAddress: wallet });

  if (!user) {
    res
      .status(401)
      .json({ message: "Wallet address not found. Please sign up first." });

    return;
  }

  res.status(200).json({ message: "Login successful!", user });
};

const UserController = {
  create: wrapAsync(create),
  login: wrapAsync(login),
};

module.exports = UserController;
