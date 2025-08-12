const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'images.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

function insertImage(filename, url) {
  try {
    const stmt = db.prepare(`INSERT INTO images (filename, url) VALUES (?, ?)`);
    const info = stmt.run(filename, url);
    return Promise.resolve({ id: info.lastInsertRowid });
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports = { insertImage };