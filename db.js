// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'images.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

function insertImage(filename, url) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO images (filename, url) VALUES (?, ?)`,
      [filename, url],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

module.exports = { insertImage };