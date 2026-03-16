const express = require("express");
const router = express.Router();

const protect = require("../../middleware/auth.middleware");
const connectionController = require("./connection.controller");

router.get("/", protect, connectionController.getConnections);

module.exports = router;
