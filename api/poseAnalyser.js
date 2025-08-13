const { spawn } = require('child_process');
const path = require('path');

module.exports = {
  analyzePose: async (imagePath) => {
    const scriptPath = path.join(__dirname, '../python/extract_pose.py');

    return new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath, imagePath]);

      let data = '';
      let error = '';

      python.stdout.on('data', (chunk) => {
        data += chunk.toString();
      });

      python.stderr.on('data', (chunk) => {
        error += chunk.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const keypoints = JSON.parse(data);
            resolve(keypoints);
          } catch (err) {
            reject(`Failed to parse keypoints: ${err}`);
          }
        } else {
          reject(`Python error: ${error}`);
        }
      });
    });
  },
};