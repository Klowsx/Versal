const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  type: { type: String, enum: ["basic", "premium"] },
  status: { type: String, enum: ["active", "expired"] },
});

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profileImage: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  bio: { type: String },
  subscription: subscriptionSchema,
  totalCoinsReceived: { type: Number, default: 0 },
});

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
