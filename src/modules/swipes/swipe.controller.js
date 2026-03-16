const Swipe = require("./swipe.model");
const Connection = require("../connections/connection.model");

const swipeUser = async (req, res) => {
  try {
    const fromUser = req.user._id;
    const { toUserId, action } = req.body;

    if (!toUserId || !action) {
      return res.status(400).json({
        success: false,
        message: "toUserId and action required",
      });
    }

    // Prevent duplicate swipe using upsert
    const swipe = await Swipe.findOneAndUpdate(
      { fromUser, toUser: toUserId },
      { action },
      { new: true, upsert: true }
    );

    // If pass → no match logic
    if (action === "pass") {
      return res.json({
        success: true,
        isMatch: false,
      });
    }

    // Check if other user liked back
    const reciprocalSwipe = await Swipe.findOne({
      fromUser: toUserId,
      toUser: fromUser,
      action: "like",
    });

    if (reciprocalSwipe) {
      // Create connection safely
      try {
        await Connection.create({
          users: [fromUser, toUserId].sort(),
        });
      } catch (err) {
        // ignore duplicate connection error
      }

      return res.json({
        success: true,
        isMatch: true,
      });
    }

    return res.json({
      success: true,
      isMatch: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Swipe error",
    });
  }
};

module.exports = {
  swipeUser,
};
