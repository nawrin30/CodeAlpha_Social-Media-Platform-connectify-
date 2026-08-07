// Middleware to ensure user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
}

module.exports = { isAuthenticated };