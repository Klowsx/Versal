const User = require("./user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function isValidPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d]).{8,}$/;
  return regex.test(password);
}

async function registerUser({ email, password, username, fullName }) {
  if (!isValidPassword(password)) {
    return {
      error:
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un carácter especial.",
    };
  }

  const existing = await User.findOne({ email });
  if (existing) return { error: "Email already in use" };

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, username, fullName });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) return { error: "Credenciales invalidas" };

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: "Credenciales invalidas" };

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
}

module.exports = { registerUser, loginUser };
