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

// POST: Upload a new reel
router.post("/add", isAuthenticated, upload.single('video'), addNewReel);

// GET: All reels
router.get("/all", isAuthenticated, getAllReels);

// PUT: Like a reel
router.post("/like/:id", isAuthenticated, likeReel);

// PUT: Dislike a reel
router.post("/dislike/:id", isAuthenticated, dislikeReel);

// POST: Add a comment to a reel
router.post("/comment/:id", isAuthenticated, addCommentToReel);

// GET: Get all comments of a reel
router.get("/comments/:id", isAuthenticated, getReelComments);

// PUT: Bookmark or remove bookmark for a reel
router.route("/:id/bookmark").get(isAuthenticated, bookmarkReel);

router.get("/user/:userId", getUserReels);
// DELETE: Delete a reel
router.delete("/:id", isAuthenticated, deleteReel);


module.exports = router;
