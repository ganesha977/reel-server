const express = require("express");
const isAuthenticated = require("../middleware/isAuthenticated");
const upload = require("../middleware/multer");
const { addStory, getStories, getUserStories, deleteStory  } = require("../controller/story.controller");

const router = express.Router();

// Add a story
router.post("/add", isAuthenticated, upload.single("image"), addStory);

// Get all stories (for current user + following)
router.get("/all", isAuthenticated, getStories);
router.get("/user/:userId", isAuthenticated, getUserStories);
router.delete("/:storyId", isAuthenticated, deleteStory);

// Optional: Route to manually trigger cleanup (for testing)
// router.delete("/cleanup", deleteExpiredStoriesFromCloudinary);

module.exports = router;
