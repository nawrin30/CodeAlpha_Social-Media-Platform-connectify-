const db = require('../config/database');

// Get all posts for newsfeed or user profile feed
exports.getPosts = (req, res) => {
  const currentUserId = req.session.userId;
  const usernameFilter = req.query.username;

  let sql = `
    SELECT posts.*, users.username, users.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comment_count,
      (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as user_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
  `;

  let params = [currentUserId];

  if (usernameFilter) {
    sql += ` WHERE users.username = ? ORDER BY posts.created_at DESC`;
    params.push(usernameFilter);
  } else {
    sql += ` ORDER BY posts.created_at DESC`;
  }

  db.all(sql, params, (err, posts) => {
    if (err) return res.status(500).json({ error: 'Database query failed.' });
    return res.status(200).json({ posts });
  });
};

// Create a new post
exports.createPost = (req, res) => {
  const userId = req.session.userId;
  const { content } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  const sql = 'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)';
  db.run(sql, [userId, content, image], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to create post.' });
    return res.status(201).json({ message: 'Post created successfully!', postId: this.lastID });
  });
};

// Edit post content
exports.updatePost = (req, res) => {
  const userId = req.session.userId;
  const postId = req.params.id;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  // Ensure owner edit protection
  db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to edit this post.' });

    const sql = 'UPDATE posts SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [content, postId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update post.' });
      return res.status(200).json({ message: 'Post updated successfully.' });
    });
  });
};

// Delete post
exports.deletePost = (req, res) => {
  const userId = req.session.userId;
  const postId = req.params.id;

  // Ensure owner deletion protection
  db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to delete this post.' });

    const sql = 'DELETE FROM posts WHERE id = ?';
    db.run(sql, [postId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete post.' });
      return res.status(200).json({ message: 'Post deleted successfully.' });
    });
  });
};

// Like a post
exports.likePost = (req, res) => {
  const userId = req.session.userId;
  const postId = req.params.id;

  const sql = 'INSERT INTO likes (post_id, user_id) VALUES (?, ?)';
  db.run(sql, [postId, userId], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Post already liked.' });
      }
      return res.status(500).json({ error: 'Failed to like post.' });
    }
    return res.status(200).json({ message: 'Post liked successfully.' });
  });
};


exports.unlikePost = (req, res) => {
  const userId = req.session.userId;
  const postId = req.params.id;

  const sql = 'DELETE FROM likes WHERE post_id = ? AND user_id = ?';
  db.run(sql, [postId, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to unlike post.' });
    return res.status(200).json({ message: 'Post unliked successfully.' });
  });
};