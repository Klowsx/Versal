const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
  donatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Donation", donationSchema);
