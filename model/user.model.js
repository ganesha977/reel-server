const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  reels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reel' }]
  ,
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],


  bookmarkedReels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel'
    }
  ]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
