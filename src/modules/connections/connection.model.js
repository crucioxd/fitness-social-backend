const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

connectionSchema.index({ users: 1 });

module.exports = mongoose.model("Connection", connectionSchema);
