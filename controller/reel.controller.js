const sharp = require("sharp");
const Cloudinary = require("../config/Cloudinary.js");
const Reel = require("../model/reel.model");
const User = require("../model/user.model");
const Comment = require("../model/Comment.js");
const { getReceiverSocketId, io } = require("../Socket.js");
const { getDataUri } = require("../config/DataUri");
const cron = require("node-cron");

const addNewReel = async (req, res) => {
  try {
    const { caption } = req.body;
    const video = req.file;
    const authorId = req.id;

    if (!video) {
      return res.status(400).json({ message: "Please upload a video", success: false });
    }

    const fileUri = getDataUri(video);

    // ✅ Use upload_large for videos and add timeout + chunking
    const uploadRes = await Cloudinary.uploader.upload_large(fileUri, {
      resource_type: "video",
      chunk_size: 6000000, // 6MB chunks
      timeout: 120000,     // 2 minutes
    });

    const reel = await Reel.create({
      caption,
      video: uploadRes.secure_url,
      public_id: uploadRes.public_id,
      author: authorId,
    });

    await User.findByIdAndUpdate(authorId, { $push: { reels: reel._id } });
    await reel.populate({ path: "author", select: "-password" });

    return res.status(201).json({ message: "Reel uploaded", reel, success: true });
  } catch (error) {
    console.error("❌ Error uploading reel:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Get all reels
const getAllReels = async (req, res) => {
  try {
    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profilePicture")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });

    res.status(200).json({ message: "All reels", reels, success: true });
  } catch (error) {
    console.error("❌ Error fetching all reels:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Like a reel
const likeReel = async (req, res) => {
  try {
    const userId = req.id;
    const reelId = req.params.id;

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found", success: false });

    await reel.updateOne({ $addToSet: { likes: userId } });

    const user = await User.findById(userId).select("username profilePicture");
    const ownerId = reel.author.toString();

    if (ownerId !== userId) {
      const notification = {
        type: "like",
        userId,
        userDetails: user,
        reelId,
        message: "Your reel was liked",
      };

      const socketId = getReceiverSocketId(ownerId);
      io.to(socketId).emit("notification", notification);
    }

    res.status(200).json({ message: "Reel liked", success: true });
  } catch (error) {
    console.error("❌ Error liking reel:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Dislike a reel
const dislikeReel = async (req, res) => {
  try {
    const userId = req.id;
    const reelId = req.params.id;

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found", success: false });

    await reel.updateOne({ $pull: { likes: userId } });

    const user = await User.findById(userId).select("username profilePicture");
    const ownerId = reel.author.toString();

    if (ownerId !== userId) {
      const notification = {
        type: "dislike",
        userId,
        userDetails: user,
        reelId,
        message: "Your reel was disliked",
      };

      const socketId = getReceiverSocketId(ownerId);
      io.to(socketId).emit("notification", notification);
    }

    res.status(200).json({ message: "Reel disliked", success: true });
  } catch (error) {
    console.error("❌ Error disliking reel:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Add comment to reel
const addCommentToReel = async (req, res) => {
  try {
    const reelId = req.params.id.trim();
    const userId = req.id;
    const { text } = req.body;

    if (!text) return res.status(400).json({ message: "Comment text required", success: false });

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found", success: false });

    let comment = await Comment.create({ text, post: reelId, author: userId });
    comment = await comment.populate("author", "username profilePicture");

    reel.comments.push(comment._id);
    await reel.save();

    res.status(201).json({ message: "Comment added", comment, success: true });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Get comments of a reel
const getReelComments = async (req, res) => {
  try {
    const reelId = req.params.id;

    const comments = await Comment.find({ post: reelId }).populate("author", "username profilePicture");

    res.status(200).json({ message: "Comments fetched", comments, success: true });
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Bookmark or remove bookmark
const bookmarkReel = async (req, res) => {
  try {
    const reelId = req.params.id;
    const userId = req.id;

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found", success: false });

    const user = await User.findById(userId);

    if (user.bookmarks.includes(reel._id)) {
      await user.updateOne({ $pull: { bookmarks: reel._id } });
      return res.status(200).json({ message: "Reel bookmark removed", success: true });
    } else {
      await user.updateOne({ $addToSet: { bookmarks: reel._id } });
      return res.status(200).json({ message: "Reel bookmarked", success: true });
    }
  } catch (error) {
    console.error("❌ Error toggling bookmark:", error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// Get reels of a specific user
const getUserReels = async (req, res) => {
  try {
    const { userId } = req.params;

    const reels = await Reel.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("author", "username profilePicture")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });

    res.status(200).json({ message: "User reels", reels, success: true });
  } catch (error) {
    console.error("❌ Error fetching user reels:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// CRON Job to delete reels older than 24 hours
cron.schedule("* * * * *", async () => {
  const expiry = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    const expiredReels = await Reel.find({ createdAt: { $lt: expiry } });

    for (const reel of expiredReels) {
      if (reel.public_id) {
        await Cloudinary.uploader.destroy(reel.public_id, { resource_type: "video" });
      }

      await Reel.findByIdAndDelete(reel._id);
      console.log(`🗑️ Reel by user ${reel.author} deleted after 24 hours`);
    }
  } catch (err) {
    console.error("❌ Failed to delete expired reels:", err);
  }
});
// DELETE: Delete a reel
const deleteReel = async (req, res) => {
  try {
    const reelId = req.params.id;
    const userId = req.id;

    const reel = await Reel.findById(reelId);

    if (!reel) {
      return res.status(404).json({ message: "Reel not found", success: false });
    }

    // Check if the logged-in user is the author
    if (reel.author.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    // Delete from Cloudinary if present
    if (reel.public_id) {
      await Cloudinary.uploader.destroy(reel.public_id, { resource_type: "video" });
    }

    // Remove reel from user model
    await User.findByIdAndUpdate(userId, { $pull: { reels: reel._id } });

    // Delete reel itself
    await Reel.findByIdAndDelete(reelId);

    return res.status(200).json({ message: "Reel deleted successfully", success: true });
  } catch (error) {
    console.error("❌ Error deleting reel:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
module.exports = {
  addNewReel,
  getAllReels,
  likeReel,
  dislikeReel,
  addCommentToReel,
  getReelComments,
  bookmarkReel,
  getUserReels,
  deleteReel

};
