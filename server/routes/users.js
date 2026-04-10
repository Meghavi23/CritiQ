const UserController = require("../controller/user");
const { createComapny, loginCompany } = require("../controller/user");

const router = require("express").Router();

router.post("/signup", UserController.create);

router.post("/login", UserController.login);

module.exports = router;
