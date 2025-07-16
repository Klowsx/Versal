const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  purchaseType: { type: String, enum: ["subscription", "coin_package"], required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  transactionDate: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ["successful", "failed"], required: true },
  paymentId: { type: String },
});

module.exports = mongoose.model("Transaction", transactionSchema);
