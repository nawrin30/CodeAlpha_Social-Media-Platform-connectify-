const bcrypt = require('bcryptjs');
const db = require('../config/database');


exports.register = (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (user) return res.status(400).json({ error: 'Username or Email already taken.' });

    
    const hashedPassword = bcrypt.hashSync(password, 10);

    
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.run(sql, [username, email, hashedPassword], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to register user.' });

      
      req.session.userId = this.lastID;
      req.session.username = username;

      return res.status(201).json({ message: 'User registered successfully!', userId: this.lastID });
    });
  });
};


exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(400).json({ error: 'Invalid username or password.' });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid username or password.' });

    
    req.session.userId = user.id;
    req.session.username = user.username;

    return res.status(200).json({ message: 'Login successful!', user: { id: user.id, username: user.username } });
  });
};


exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout.' });
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully.' });
  });
};


exports.checkAuth = (req, res) => {
  if (req.session && req.session.userId) {
    db.get('SELECT id, username, profile_picture, bio FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      if (err || !user) return res.status(401).json({ loggedIn: false });
      return res.status(200).json({ loggedIn: true, user });
    });
  } else {
    return res.status(200).json({ loggedIn: false });
  }
};