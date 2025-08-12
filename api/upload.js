const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { insertImage } = require('../db');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

module.exports = (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
      const fileUrls = req.files.map(f => {
        const filename = path.basename(f.path);
        const url = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/uploads/${filename}`;
        insertImage(filename, url);
        return url;
      });

      res.json({ message: 'Files uploaded successfully', files: fileUrls });
    } catch (e) {
      console.error('Insert error:', e);
      res.status(500).json({ error: 'Failed to save metadata' });
    }
  });
};