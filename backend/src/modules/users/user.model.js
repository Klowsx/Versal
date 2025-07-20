const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  type: { type: String, enum: ["basic", "premium"], default: "basic" },
  status: { type: String, enum: ["active", "expired"], default: "active" },
});

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profileImage: { type: String, default: null },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  bio: { type: String, default: null },
  subscription: {
    type: subscriptionSchema,
    default: () => ({ type: "basic", status: "active" }),
  },
  totalCoinsReceived: { type: Number, default: 0 },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
