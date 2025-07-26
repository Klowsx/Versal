const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "onModel",
    },
    onModel: {
      type: String,
      required: true,
      enum: ["Story", "Chapter"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interactionType: {
      type: String,
      required: true,
      enum: ["like", "comment"],
    },
    text: {
      type: String,

      required: function () {
        return this.interactionType === "comment";
      },
    },
  },
  {
    timestamps: true,
  }
);

interactionSchema.index(
  { contentId: 1, userId: 1, interactionType: 1 },
  {
    unique: true,
    partialFilterExpression: { interactionType: "like" },
  }
);

module.exports = mongoose.model("Interaction", interactionSchema);
