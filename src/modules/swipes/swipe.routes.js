const express = require("express");
const router = express.Router();
const protect = require("../../middleware/auth.middleware");
const swipeController = require("./swipe.controller");

router.post("/", protect, swipeController.swipeUser);

module.exports = router;
