const db = require('../config/database');

// Get user profile details by username
exports.getUserProfile = (req, res) => {
  const targetUsername = req.params.username;
  const currentUserId = req.session.userId;

  const sqlUser = `
    SELECT id, username, email, profile_picture, bio, created_at 
    FROM users WHERE username = ?
  `;

  db.get(sqlUser, [targetUsername], (err, targetUser) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    // Count posts
    db.get('SELECT COUNT(*) as postCount FROM posts WHERE user_id = ?', [targetUser.id], (err, pRes) => {
      if (err) return res.status(500).json({ error: 'Database error.' });

      // Count followers
      db.get('SELECT COUNT(*) as followerCount FROM follows WHERE following_id = ?', [targetUser.id], (err, fRes) => {
        if (err) return res.status(500).json({ error: 'Database error.' });

        // Count following
        db.get('SELECT COUNT(*) as followingCount FROM follows WHERE follower_id = ?', [targetUser.id], (err, fgRes) => {
          if (err) return res.status(500).json({ error: 'Database error.' });

          // Check if logged-in user is following target user
          db.get('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [currentUserId, targetUser.id], (err, isFollow) => {
            if (err) return res.status(500).json({ error: 'Database error.' });

            return res.status(200).json({
              user: targetUser,
              stats: {
                posts: pRes.postCount,
                followers: fRes.followerCount,
                following: fgRes.followingCount
              },
              isFollowing: !!isFollow,
              isSelf: currentUserId === targetUser.id
            });
          });
        });
      });
    });
  });
};

// Update profile picture and bio
exports.updateProfile = (req, res) => {
  const userId = req.session.userId;
  const { bio } = req.body;
  let profilePicture = req.file ? req.file.filename : null;

  if (profilePicture) {
    const sql = 'UPDATE users SET bio = ?, profile_picture = ? WHERE id = ?';
    db.run(sql, [bio, profilePicture, userId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update profile.' });
      return res.status(200).json({ message: 'Profile updated successfully!' });
    });
  } else {
    const sql = 'UPDATE users SET bio = ? WHERE id = ?';
    db.run(sql, [bio, userId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update profile.' });
      return res.status(200).json({ message: 'Profile updated successfully!' });
    });
  }
};

// Search users by username query
exports.searchUsers = (req, res) => {
  const query = req.query.q || '';
  const sql = `SELECT id, username, profile_picture, bio FROM users WHERE username LIKE ? LIMIT 20`;
  
  db.all(sql, [`%${query}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database search failed.' });
    return res.status(200).json({ users: rows });
  });
};

// Follow user
exports.followUser = (req, res) => {
  const followerId = req.session.userId;
  const followingId = parseInt(req.params.id);

  if (followerId === followingId) {
    return res.status(400).json({ error: 'You cannot follow yourself.' });
  }

  const sql = 'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)';
  db.run(sql, [followerId, followingId], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Already following this user.' });
      }
      return res.status(500).json({ error: 'Database error.' });
    }
    return res.status(200).json({ message: 'User followed successfully.' });
  });
};

// Unfollow user
exports.unfollowUser = (req, res) => {
  const followerId = req.session.userId;
  const followingId = parseInt(req.params.id);

  const sql = 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?';
  db.run(sql, [followerId, followingId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error.' });
    return res.status(200).json({ message: 'User unfollowed successfully.' });
  });
};