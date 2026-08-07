const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.delete('/:id', isAuthenticated, commentController.deleteComment);

module.exports = router;