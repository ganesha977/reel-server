const express = require("express");
const {
  editProfile,
  followOrUnfollow,
  getprofile,
  getsuggesteduser,
  login,
  logout,
  register,
  getProfile,
  searchUsers,
  
} = require("../controller/user.controller.js");

const isAuthenticated = require("../middleware/isAuthenticated.js");
const upload = require("../middleware/multer.js");

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/:id/profile').get(isAuthenticated, getProfile);
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePhoto'), editProfile);
router.route('/suggested').get(isAuthenticated, getsuggesteduser);
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow);
router.route("/search").get(isAuthenticated, searchUsers);


module.exports = router;
