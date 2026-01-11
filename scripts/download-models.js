// Script to download face-api.js models
// Run with: node scripts/download-models.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models', 'face-api');

const models = [
  // Tiny Face Detector
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  
  // Face Expression Net
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json'
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${path.basename(dest)}`);
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('Downloading face-api.js models...');
  
  for (const model of models) {
    const url = BASE_URL + model;
    const dest = path.join(OUTPUT_DIR, model);
    
    try {
      await downloadFile(url, dest);
    } catch (error) {
      console.error(`Error downloading ${model}:`, error.message);
    }
  }
  
  console.log('Model download complete!');
}

downloadModels();
