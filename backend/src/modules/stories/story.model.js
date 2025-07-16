const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  _id: false,
  id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
});

const storySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    synopsis: { type: String },
    coverImage: { type: String },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String },
    keywords: [{ type: String }],
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    chapters: [chapterSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);
