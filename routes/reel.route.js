const express = require("express");
const isAuthenticated = require("../middleware/isAuthenticated");
const upload = require("../middleware/multer");
const {
  addNewReel,
  getAllReels,
  likeReel,
  dislikeReel,
  addCommentToReel,
  getReelComments,
  toggleBookmarkReel,
  getUserReels,
  bookmarkReel,
  deleteReel,
} = require("../controller/reel.controller");

const router = express.Router();

router.post("/add", isAuthenticated, upload.single('video'), addNewReel);

router.get("/all", isAuthenticated, getAllReels);

router.post("/like/:id", isAuthenticated, likeReel);

router.post("/dislike/:id", isAuthenticated, dislikeReel);

router.post("/comment/:id", isAuthenticated, addCommentToReel);

router.get("/comments/:id", isAuthenticated, getReelComments);

router.route("/:id/bookmark").get(isAuthenticated, bookmarkReel);

router.get("/user/:userId", getUserReels);
router.delete("/:id", isAuthenticated, deleteReel);


module.exports = router;
