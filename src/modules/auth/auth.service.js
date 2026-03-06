const bcrypt = require("bcrypt");
const User = require("../users/user.model");
const generateToken = require("../../utils/generateToken");

const registerUser = async (data) => {
  const { name, email, password, dateOfBirth, fitnessLevel } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash: hashedPassword,
    dateOfBirth,
    fitnessLevel,
  });

  const token = generateToken(user._id);

  return { user, token };
};

const loginUser = async (data) => {
  const { email, password } = data;

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user._id);

  return { user, token };
};

module.exports = {
  registerUser,
  loginUser,
};
