const sharp = require("sharp");
const Cloudinary = require("../config/Cloudinary.js");
const Post = require("../model/post.model");
const User = require("../model/user.model");
const Comment = require("../model/Comment.js");
const { getReceiverSocketId ,io} = require("../Socket.js");
const axios = require('axios');


const addnewpost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) {
      return res.status(400).json({ msg: "Please upload an image" });
    }

    const optimizedimagebuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800 })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    const fileuri = `data:image/jpeg;base64,${optimizedimagebuffer.toString("base64")}`;
    const cloudResponse = await Cloudinary.uploader.upload(fileuri);

    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });

    if (!post || !post._id) {
      return res.status(500).json({ message: "Post creation failed", success: false });
    }

    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });

    return res.status(201).json({
      message: "new post added",
      post,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};





const getallposts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'author', select: 'username profilePicture' })
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    return res.status(200).json({
      message: "all posts",
      posts,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const getuserpost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: 'author', select: 'username profilePicture' })
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    return res.status(200).json({
      message: "user posts",
      posts,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", success: false });
    return  console.error(error);

  }
};

const likepost = async (req, res) => {
  try {
    const likekarnewalakId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "post not found", success: false });

    await post.updateOne({ $addToSet: { likes: likekarnewalakId } });
    await post.save();
    const user=await User.findById(likekarnewalakId).select('username profilePicture');
    const PostownerId=  post.author.toString();
    if(PostownerId!==likekarnewalakId){
const notification={
  type:'like',
  userId:likekarnewalakId,
  userDetails:user,
  postId,
  message:`   your post was liked `
}
const postOwnersocketId=getReceiverSocketId(PostownerId);
io.to(postOwnersocketId).emit('notification',notification)
    }

    return res.status(200).json({ message: "post liked successfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const dislikePost = async (req, res) => {
  try {
    const likekarnewalakId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "post not found", success: false });

    await post.updateOne({ $pull: { likes: likekarnewalakId } });
    await post.save();


     const user=await User.findById(likekarnewalakId).select('username profilePicture');
    const PostownerId=  post.author.toString();
    if(PostownerId!==likekarnewalakId){
//emit a notification event
const notification={
  type:'dislike',
  userId:likekarnewalakId,
  userDetails:user,
  postId,
  message:`   your post was disliked `
}
const postOwnersocketId=getReceiverSocketId(PostownerId);
io.to(postOwnersocketId).emit('notification',notification)
    }


    return res.status(200).json({ message: "post disliked", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};



const Addcomment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentAuthorId = req.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required", success: false });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: false });
    }

    let comment = await Comment.create({
      text,
      post: postId,
      author: commentAuthorId
    });

    comment = await comment.populate({ path: "author", select: "username profilePicture" });

    post.comments.push(comment._id);
    await post.save();

    // 🔹 Send socket notification to post owner
    const PostOwnerId = post.author.toString();
    if (PostOwnerId !== commentAuthorId) {
      const commenterUser = await User.findById(commentAuthorId).select("username profilePicture");

      const notification = {
        type: "comment",
        userId: commentAuthorId,
        userDetails: commenterUser,
        postId,
        message: `commented on your post: "${text}"`
      };

      const postOwnerSocketId = getReceiverSocketId(PostOwnerId);
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit("commentNotification", notification);
      }
    }

    res.status(201).json({ message: "Comment added", comment, success: true });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};




const getcommentofpost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }).populate('author', 'username profilePicture');

    if (!comments || comments.length === 0) {
      return res.status(404).json({ message: "No comments found for this post", success: false });
    }

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found", success: false });

    if (post.author.toString() !== authorId) {
      return res.status(403).json({ message: "You are not allowed to delete this post", success: false });
    }

    await Post.findByIdAndDelete(postId);

    await User.findByIdAndUpdate(authorId, {
      $pull: { posts: postId }
    });

    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false,error });
  }
};

const bookmark = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: false });
    }

    const user = await User.findById(userId);
    if (user.bookmarks.includes(post._id)) {
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({ message: "Post bookmark removed", success: true });
    } else {
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({ message: "Post bookmarked", success: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

module.exports = {
  addnewpost,
  getallposts,
  getuserpost,
  likepost,
  dislikePost,
  Addcomment,
  getcommentofpost,
  deletePost,
  bookmark
};
