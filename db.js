const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'images.db');
const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// ✅ Create tables if DB is new
if (!dbExists) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        url TEXT NOT NULL
      )
    `, (err) => {
      if (err) console.error('❌ Table "images" creation failed:', err.message);
      else console.log('✅ Table "images" created');
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS pose_entries (
        id TEXT PRIMARY KEY,
        keypoints TEXT
      )
    `, (err) => {
      if (err) console.error('❌ Table "pose_entries" creation failed:', err.message);
      else console.log('✅ Table "pose_entries" created');
    });
  });
} else {
  // Ensure pose_entries table exists even if DB already exists
  db.run(`
    CREATE TABLE IF NOT EXISTS pose_entries (
      id TEXT PRIMARY KEY,
      keypoints TEXT
    )
  `);
}

// ✅ Insert image metadata
function insertImage(filename, url) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO images (filename, url) VALUES (?, ?)');
    stmt.run(filename, url, function (err) {
      if (err) {
        console.error('❌ Insert image failed:', err.message);
        reject(err);
      } else {
        console.log(`✅ Inserted image: ${filename}`);
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

// ✅ Insert pose keypoints
function insertKeypoints(id, keypoints) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(keypoints);
    db.run(
      `INSERT OR REPLACE INTO pose_entries (id, keypoints) VALUES (?, ?)`,
      [id, json],
      function (err) {
        if (err) {
          console.error('❌ Failed to insert keypoints:', err.message);
          reject(err);
        } else {
          console.log(`✅ Keypoints stored for image ${id}`);
          resolve();
        }
      }
    );
  });
}


function getKeypoints(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT keypoints FROM pose_entries WHERE id = ?`, [id], (err, row) => {
      if (err || !row) {
        reject(err || new Error('No keypoints found'));
      } else {
        try {
          const parsed = JSON.parse(row.keypoints);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse keypoints'));
        }
      }
    });
  });
}

module.exports = {
  insertImage,
  insertKeypoints,
  getKeypoints
};