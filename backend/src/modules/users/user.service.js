const User = require("./user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function isValidPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d]).{8,}$/;
  return regex.test(password);
}

async function registerUser({ email, password, username }) {
  if (!isValidPassword(password)) {
    return {
      error:
        "Password must be at least 8 characters long, include a lowercase, an uppercase letter, and a special character.",
    };
  }

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
