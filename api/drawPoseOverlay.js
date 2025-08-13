const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function drawPoseOverlay(imagePath, keypoints, outputPath) {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0);

    const paintCircle = (x, y) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'red';
      ctx.fill();
    };

    const drawLine = (fromName, toName) => {
      const p1 = keypoints.find(p => p.name.toLowerCase() === fromName.toLowerCase());
      const p2 = keypoints.find(p => p.name.toLowerCase() === toName.toLowerCase());
      if (!p1 || !p2) return;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Draw all keypoints
    keypoints.forEach(p => {
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        paintCircle(p.x, p.y);
      }
    });

    // Draw skeleton connections (customize as needed)
    const connections = [
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'right_shoulder'],
      ['left_hip', 'right_hip'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
    ];

    connections.forEach(([from, to]) => drawLine(from, to));

    // Save the annotated image
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createJPEGStream();
    stream.pipe(out);

    out.on('finish', () => {
      console.log(`✅ Pose overlay saved to ${outputPath}`);
    });
  } catch (err) {
    console.error('❌ Failed to draw pose overlay:', err);
    throw err;
  }
}

module.exports = { drawPoseOverlay };