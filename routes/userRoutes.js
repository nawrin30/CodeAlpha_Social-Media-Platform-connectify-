const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/authMiddleware');


const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadProfile = multer({ storage: profileStorage });

router.get('/search', isAuthenticated, userController.searchUsers);
router.get('/:username', isAuthenticated, userController.getUserProfile);
router.put('/profile', isAuthenticated, uploadProfile.single('profile_picture'), userController.updateProfile);
router.post('/:id/follow', isAuthenticated, userController.followUser);
router.delete('/:id/follow', isAuthenticated, userController.unfollowUser);

module.exports = router;