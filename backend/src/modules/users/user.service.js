const User = require("./user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function registerUser({ email, password, username }) {
  const existing = await User.findOne({ email });
  if (existing) return { error: "Email already in use" };

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, username });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) return { error: "Invalid credentials" };

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: "Invalid credentials" };

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
}

module.exports = { registerUser, loginUser };
