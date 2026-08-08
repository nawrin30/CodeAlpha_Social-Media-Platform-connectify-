const db = require('../config/database');


exports.getComments = (req, res) => {
  const postId = req.params.id;

  const sql = `
    SELECT comments.*, users.username, users.profile_picture 
    FROM comments 
    JOIN users ON comments.user_id = users.id 
    WHERE comments.post_id = ? 
    ORDER BY comments.created_at ASC
  `;

  db.all(sql, [postId], (err, comments) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch comments.' });
    return res.status(200).json({ comments });
  });
};


exports.createComment = (req, res) => {
  const userId = req.session.userId;
  const postId = req.params.id;
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Comment text cannot be empty.' });
  }

  const sql = 'INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)';
  db.run(sql, [postId, userId, text], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to add comment.' });
    return res.status(201).json({ message: 'Comment added successfully!', commentId: this.lastID });
  });
};


exports.deleteComment = (req, res) => {
  const userId = req.session.userId;
  const commentId = req.params.id;

  
  db.get('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (comment.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to delete this comment.' });

    const sql = 'DELETE FROM comments WHERE id = ?';
    db.run(sql, [commentId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete comment.' });
      return res.status(200).json({ message: 'Comment deleted successfully.' });
    });
  });
};