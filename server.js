const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { insertImage } = require('./db');

const app = express();
const PORT = 3000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve static files from uploads/
app.use('/uploads', express.static(uploadDir));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.post('/upload', upload.any(), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const fileUrls = [];

    for (const f of req.files) {
      const filename = path.basename(f.path);
      const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      await insertImage(filename, url); // Save to SQLite
      fileUrls.push(url);
    }

    res.json({
      message: 'Files uploaded successfully',
      files: fileUrls
    });
  } catch (err) {
    console.error('SQLite insert error:', err);
    res.status(500).json({ error: 'Failed to save metadata to SQLite' });
  }
});

// Error handling for Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});