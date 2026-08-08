const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const { initDb } = require('./models/databaseModels');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;


const profilesDir = path.join(__dirname, 'uploads', 'profiles');
const postsDir = path.join(__dirname, 'uploads', 'posts');
fs.mkdirSync(profilesDir, { recursive: true });
fs.mkdirSync(postsDir, { recursive: true });


initDb();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
  secret: 'connectify_super_secret_key_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day duration
  }
}));


app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);


app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});