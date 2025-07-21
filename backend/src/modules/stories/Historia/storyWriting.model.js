const mongoose = require("mongoose");

const storywritingSchema = new mongoose.Schema({

    storyId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "storyCreation",
        required: true
    },
    title: {
        type: String,
        trim: true,
        maxLength: 20,
        minLength: 1
    },
    descripcion: {
        type: String,
        maxLength: 20000,
        default: null
    },
    esBorrador: {
        type: Boolean,
        default: true
    }

}, {timestamps: true }

);

module.exports = mongoose.model("storyWriting", storywritingSchema);