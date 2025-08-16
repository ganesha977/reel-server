const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  image: { type: String, required: true },
  public_id: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours
});

const Story = mongoose.model("Story", storySchema);
module.exports = Story;
