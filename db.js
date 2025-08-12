const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'images.db');
const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

if (!dbExists) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        url TEXT NOT NULL
      )
    `, (err) => {
      if (err) console.error('Table creation failed:', err.message);
      else console.log('Table "images" created');
    });
  });
}

function insertImage(filename, url) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO images (filename, url) VALUES (?, ?)');
    stmt.run(filename, url, function (err) {
      if (err) {
        console.error('Insert failed:', err.message);
        reject(err);
      } else {
        console.log(`Inserted image: ${filename}`);
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

module.exports = { insertImage };