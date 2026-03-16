const express = require("express");
const router = express.Router();
const protect = require("../../middleware/auth.middleware");
const userController = require("./user.controller");

router.put("/profile", protect, userController.updateProfile);
router.get("/feed", protect, userController.getFeed);
router.get("/:id", protect, userController.getUserById);

module.exports = router;
