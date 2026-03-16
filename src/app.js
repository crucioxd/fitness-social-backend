require("./modules/users/user.model");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/users", require("./modules/users/user.routes"));
app.use("/api/swipes", require("./modules/swipes/swipe.routes"));
app.use("/api/connections", require("./modules/connections/connection.routes"));
app.get("/", (req, res) => {
  res.send("API running...");
});

module.exports = app;
