const {getDataUri} = require("../config/DataUri");

const User = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Cloudinary = require('../config/Cloudinary');
const Post = require("../model/post.model");
const Reel = require("../model/reel.model");





 const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password
    } = req.body;
    if (!username || !email || !password) {
      return res.status(401).json({
        message: "Something is missing, please check!",
        success: false
      });
    }
    const user = await User.findOne({
      email
    });
    if (user) {
      return res.status(401).json({
        message: "Try different email",
        success: false
      });
    }
    ;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword
    });
    return res.status(201).json({
      message: "Account created successfully.",
      success: true
    });
  } catch (error) {
    console.log(error);
  }
};




// const login = async (req, res) => {
//   try {
//     const {
//       email,
//       password
//     } = req.body;
//     if (!email || !password) {
//       return res.status(401).json({
//         message: "Something is missing, please check!",
//         success: false
//       });
//     }
//     let user = await User.findOne({
//       email
//     });
//     if (!user) {
//       return res.status(401).json({
//         message: "Incorrect email or password",
//         success: false
//       });
//     }
//     const isPasswordMatch = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatch) {
//       return res.status(401).json({
//         message: "Incorrect email or password",
//         success: false
//       });
//     }
//     ;
//     const token = await jwt.sign({
//       userId: user._id
//     }, process.env.SECRET, {
//       expiresIn: '1d'
//     });

//     // populate each post if in the posts array
//     const populatedPosts = await Promise.all(user.posts.map(async postId => {
//       const post = await Post.findById(postId);
//       if (post.author.equals(user._id)) {
//         return post;
//       }
//       return null;
//     }));
//     user = {
//       _id: user._id,
//       username: user.username,
//       email: user.email,
//       profilePicture: user.profilePicture,
//       bio: user.bio,
//       followers: user.followers,
//       following: user.following,
//       posts: populatedPosts
//     };
//     return res.cookie('token', token, {
//       httpOnly: true,
//       sameSite: 'strict',
//       maxAge: 1 * 24 * 60 * 60 * 1000
//     }).json({
//       message: `Welcome back ${user.username}`,
//       success: true,
//       user
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };


//  const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         if (!email || !password) {
//             return res.status(401).json({
//                 message: "Something is missing, please check!",
//                 success: false,
//             });
//         }
//         let user = await User.findOne({ email });
//         if (!user) {
//             return res.status(401).json({
//                 message: "Incorrect email or password",
//                 success: false,
//             });
//         }
//         const isPasswordMatch = await bcrypt.compare(password, user.password);
//         if (!isPasswordMatch) {
//             return res.status(401).json({
//                 message: "Incorrect email or password",
//                 success: false,
//             });
//         };

//         const token = await jwt.sign({ userId: user._id }, process.env.SECRET, { expiresIn: '1d' });

//         // populate each post if in the posts array
//         const populatedPosts = await Promise.all(
//     user.posts.map(async (postId) => {
//         const post = await Post.findById(postId);
//         if (post && post.author && post.author.equals(user._id)) {
//             return post;
//         }
//         return null;
//     })
// );

//         user = {
//             _id: user._id,
//             username: user.username,
//             email: user.email,
//             profilePicture: user.profilePicture,
//             bio: user.bio,
//             followers: user.followers,
//             following: user.following,
//             posts: populatedPosts,
//             reel:user.reels
//         }
//         return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
//             message: `Welcome back ${user.username}`,
//             success: true,
//             user
//         });

//     } catch (error) {
//         console.log(error);
//     }
// };


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        message: "Something is missing, please check!",
        success: false,
      });
    }

    // 🔍 Find user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // 🔐 Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // 🧠 Create token
    const token = jwt.sign({ userId: user._id }, process.env.SECRET, {
      expiresIn: "7d",
    });

    // ✅ Populate posts
    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId)
          .populate("author", "username profilePicture");
        return post;
      })
    );

    // ✅ Populate reels with null check
    const populatedReels = await Promise.all(
      user.reels.map(async (reelId) => {
        try {
          const reel = await Reel.findById(reelId)
            .populate("author", "username profilePicture");
          return reel;
        } catch (err) {
          console.error(`Error loading reel ${reelId}:`, err.message);
          return null;
        }
      })
    );

    const validReels = populatedReels.filter(Boolean); // remove nulls

    // ✅ Final user object to return
    const formattedUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatedPosts,
      reels: validReels,
      bookmarks: user.bookmarks,
      bookmarkedReels: user.bookmarkedReels,
      gender: user.gender,
      createdAt: user.createdAt,
    };

    console.log("Token received:", req.cookies.token);
console.log("JWT_SECRET used to verify   during login:", process.env.SECRET);

    // ✅ Set cookie and return response
    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .status(200)
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user: formattedUser,
      });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};



const logout = async (req, res) => {
  try {
    return res.cookie("token", "", {
      maxAge: 0,
        httpOnly: true,
  secure: true,
  sameSite: "none",
    }).json({
      message: "Logged out successfully.",
      success: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Logout failed",
      success: false,
      error
    });
  }
};



const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const {
      bio,
      gender
    } = req.body;
    const profilePicture = req.file;
    let cloudResponse;
    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await Cloudinary.uploader.upload(fileUri);
    }
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({
      message: "User not found",
      success: false
    });
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (cloudResponse) user.profilePicture = cloudResponse.secure_url;
    await user.save();
    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Profile update failed",
      error
    });
  }
};




const getsuggesteduser = async (req, res) => {
  try {
    const suggestedUsers = await User.find({
      _id: {
        $ne: req.id
      }
    }).select("-password");
    if (!suggestedUsers.length) return res.status(404).json({
      message: "No suggested users",
      success: false
    });
    return res.status(200).json({
      message: "Suggested users ",
      success: true,
      users: suggestedUsers
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Fetching suggested users failed",
      error
    });
  }
};
const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    let user = await User.findById(userId)
      .select("-password")
      .populate({
        path: 'posts',
        options: { sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'username profilePicture' },
      })
      .populate({
        path: 'bookmarks',
        populate: { path: 'author', select: 'username profilePicture' },
      })
      .populate({
        path: 'reels',
        populate: { path: 'author', select: 'username profilePicture' }, // 🔥 Key fix here
      })
      .populate({
        path: 'bookmarkedReels',
        populate: { path: 'author', select: 'username profilePicture' },
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      user,
      success: true,
      message: "User profile fetched successfully",
    });

  } catch (error) {
    console.error("getProfile error:", error.message);
    return res.status(500).json({
      message: "Profile fetch failed",
      error: error.message,
      success: false,
    });
  }
};



const followOrUnfollow = async (req, res) => {
  try {
    const followkarnewala = req.id;
    const jiskofollowkarunga = req.params.id;
    if (followkarnewala === jiskofollowkarunga) return res.status(400).json({
      message: "You can't follow yourself",
      success: false
    });
    const user = await User.findById(followkarnewala);
    const targetUser = await User.findById(jiskofollowkarunga);
    if (!user || !targetUser) return res.status(404).json({
      message: "User not found",
      success: false
    });
    const isFollowing = user.following.includes(jiskofollowkarunga);
    if (isFollowing) {
      await Promise.all([user.updateOne({
        $pull: {
          following: jiskofollowkarunga
        }
      }), targetUser.updateOne({
        $pull: {
          followers: followkarnewala
        }
      })]);
      return res.status(200).json({
        message: "Unfollowed successfully",
        success: true
      });
    } else {
      await Promise.all([user.updateOne({
        $push: {
          following: jiskofollowkarunga
        }
      }), targetUser.updateOne({
        $push: {
          followers: followkarnewala
        }
      })]);
      return res.status(200).json({
        message: "Followed successfully",
        success: true
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Follow/unfollow action failed",
      error
    });
  }
};






const searchUsers = async (req, res) => {
  try {
    const query = req.query.query;
    const users = await User.find({
      username: { $regex: query, $options: "i" }
    }).select("_id username profilePic");
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {


  register,
  login,
  logout,
  getProfile,
  editProfile,
  getsuggesteduser,
  followOrUnfollow,
  searchUsers
};