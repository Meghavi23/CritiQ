const express = require("express");
const QuestionController = require("../controller/question");
const router = express.Router();

router.post("/", QuestionController.create);
router.get("/:id", QuestionController.getById);

module.exports = router;
