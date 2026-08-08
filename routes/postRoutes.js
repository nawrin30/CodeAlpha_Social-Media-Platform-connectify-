const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middleware/authMiddleware');


const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'posts'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadPost = multer({ storage: postStorage });

router.get('/', isAuthenticated, postController.getPosts);
router.post('/', isAuthenticated, uploadPost.single('image'), postController.createPost);
router.put('/:id', isAuthenticated, postController.updatePost);
router.delete('/:id', isAuthenticated, postController.deletePost);

router.post('/:id/like', isAuthenticated, postController.likePost);
router.delete('/:id/like', isAuthenticated, postController.unlikePost);


router.get('/:id/comments', isAuthenticated, commentController.getComments);
router.post('/:id/comments', isAuthenticated, commentController.createComment);

module.exports = router;