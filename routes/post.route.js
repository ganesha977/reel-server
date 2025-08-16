const express = require("express");
const isAuthenticated = require("../middleware/isAuthenticated");
const upload = require("../middleware/multer");

const {
  addnewpost,
  getallposts,
  getuserpost,
  likepost,
  dislikePost,
  Addcomment,
  getcommentofpost,
  deletePost,
  bookmark,
} = require("../controller/post.controller");

const router = express.Router();

router.route("/addpost").post(isAuthenticated, upload.single("image"), addnewpost);
router.route("/all").get(isAuthenticated, getallposts);
router.route("/userpost/all").get(isAuthenticated, getuserpost);
router.route("/:id/like").post(isAuthenticated, likepost);
router.route("/:id/dislike").post(isAuthenticated, dislikePost);
router.route("/:id/comment").post(isAuthenticated, Addcomment);
router.route("/:id/comment/all").post(isAuthenticated, getcommentofpost);
router.route("/delete/:id").delete(isAuthenticated, deletePost);
router.route("/:id/bookmark").get(isAuthenticated, bookmark);

module.exports = router;
