const Connection = require("./connection.model");
const User = require("../users/user.model");

const getConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find connections containing this user
    const connections = await Connection.find({
      users: userId,
    }).populate("users", "-passwordHash");

    // Extract the other user from each connection
    const partners = connections.map((connection) => {
      return connection.users.find(
        (user) => user._id.toString() !== userId.toString()
      );
    });

    res.json({
      success: true,
      count: partners.length,
      connections: partners,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to load connections",
    });
  }
};

module.exports = {
  getConnections,
};
