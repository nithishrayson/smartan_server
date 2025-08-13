const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const { insertImage, insertKeypoints, getKeypoints } = require('./db');
const { analyzePose } = require('./api/poseAnalyser');
const { drawPoseOverlay } = require('./api/drawPoseOverlay');

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use(cors());
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });


app.post('/extract', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const imagePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase(); // e.g. .jpg
    const imageId = path.basename(imagePath).split('.')[0];
    const outputPath = path.join(uploadDir, `${imageId}${ext}`); // ✅ Final processed image

    const result = await analyzePose(imagePath);
    const keypoints = result.keypoints;

    await drawPoseOverlay(imagePath, keypoints, outputPath); // ✅ Save as imageId + ext
    await insertKeypoints(imageId, keypoints);
    fs.unlinkSync(imagePath); // ✅ Delete original

    res.json({ imageId, keypoints });
  } catch (err) {
    console.error('❌ Pose extraction failed:', err);
    res.status(500).json({ error: 'Pose extraction failed' });
  }
});


app.get('/pose/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const keypoints = await getKeypoints(id);

    const files = fs.readdirSync(uploadDir);
    const matched = files.find(f => f.startsWith(id + '.'));

    if (!matched) {
      return res.status(404).json({ error: 'Processed image not found' });
    }

    const mappedUrl = `${req.protocol}://${req.get('host')}/uploads/${matched}`;

    res.json({
      imageId: id,
      keypoints,
      mappedImage: mappedUrl
    });
  } catch (err) {
    console.error(`❌ Failed to fetch pose for ${id}:`, err.message);
    res.status(404).json({ error: 'Pose data not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});