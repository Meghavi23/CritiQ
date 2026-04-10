const Router = require("express").Router;
const PhoneController = require("../controller/phone");
const { createPhone, getPhone } = require("../controller/phone");

const router = Router();

router.post("/", PhoneController.create);

router.get("/", PhoneController.getOne);

module.exports = router;
