const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema({
  caption: { type: String, default: "" },
  video: { type: String, required: true }, // 👈 video instead of image
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  createdAt: { type: Date, default: Date.now,expires: 86400 }
});

const Reel = mongoose.model("Reel", reelSchema);
module.exports = Reel;
