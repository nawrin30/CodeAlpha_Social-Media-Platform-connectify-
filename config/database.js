const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Establish connection to SQLite database file
const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database successfully.');
  }
});

module.exports = db;