const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reportedItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contentType: { type: String, enum: ["story", "comment"], required: true },
  reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  details: { type: String },
  status: { type: String, enum: ["pending", "reviewed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);
