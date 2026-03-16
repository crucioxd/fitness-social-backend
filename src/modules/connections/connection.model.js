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

// Prevent duplicate connections
connectionSchema.index({ users: 1 }, { unique: true });

module.exports = mongoose.model("Connection", connectionSchema);
