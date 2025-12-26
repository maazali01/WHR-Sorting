const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Product = require('../models/Products');

// Check if adm-zip is available (optional dependency)
let AdmZip;
try {
  AdmZip = require('adm-zip');
} catch (e) {
  console.warn('adm-zip not installed. Dataset extraction will fail. Run: npm install adm-zip');
}

// Storage for datasets and models
const datasetsDir = path.join(__dirname, '../uploads/datasets');
const modelsDir = path.join(__dirname, '../uploads/models');
if (!fs.existsSync(datasetsDir)) fs.mkdirSync(datasetsDir, { recursive: true });
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

// Multer config for dataset upload (zip files)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, datasetsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({ storage, fileFilter: (_req, file, cb) => {
  if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
    cb(null, true);
  } else {
    cb(new Error('Only .zip files allowed'));
  }
}});

let activeModel = null;
let trainingStatus = { running: false, log: [], objectName: null };
let trainingMetrics = {}; // { objectName: { accuracy, loss, epochs, timestamp } }

// GET /admin/ai-models/list -> list trained models
router.get('/list', async (_req, res) => {
  try {
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.pt') || f.endsWith('.onnx'));
    res.json({ models: files, active: activeModel });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list models' });
  }
});

// GET /admin/ai-models/active -> get active model
router.get('/active', (_req, res) => {
  res.json({ active: activeModel });
});

// POST /admin/ai-models/set-active -> set active model
router.post('/set-active', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Model name required' });
  const fullPath = path.join(modelsDir, name);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'Model not found' });
  activeModel = name;
  res.json({ message: 'Active model set', active: activeModel });
});

// POST /admin/ai-models/upload-dataset -> upload dataset zip
router.post('/upload-dataset', upload.single('dataset'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No dataset file uploaded' });
  const { objectName } = req.body || {};
  if (!objectName) return res.status(400).json({ message: 'Object name required' });

  if (!AdmZip) {
    return res.status(500).json({ message: 'adm-zip package not installed. Cannot extract dataset.' });
  }

  try {
    // Extract zip
    const zipPath = req.file.path;
    const extractDir = path.join(datasetsDir, objectName);
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
    fs.mkdirSync(extractDir, { recursive: true });

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    // Clean up zip
    fs.unlinkSync(zipPath);

    res.json({ message: 'Dataset uploaded and extracted', objectName, path: extractDir });
  } catch (err) {
    console.error('Dataset upload error:', err);
    res.status(500).json({ message: 'Failed to process dataset', error: err.message });
  }
});

// GET untrained products (products without trained models)
router.get('/untrained-products', async (_req, res) => {
  try {
    const products = await Product.find().lean();
    const modelsDir = path.join(__dirname, '../uploads/models');
    const trainedModels = fs.existsSync(modelsDir) 
      ? fs.readdirSync(modelsDir).map(f => f.replace(/\.(pt|onnx)$/, ''))
      : [];
    
    // filter out products that already have trained models
    const untrained = products.filter(p => !trainedModels.includes(p.name));
    res.json(untrained);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// GET training metrics
router.get('/metrics', (_req, res) => {
  res.json(trainingMetrics);
});

// POST /admin/ai-models/train -> trigger training
router.post('/train', (req, res) => {
  const { objectName } = req.body || {};
  if (!objectName) return res.status(400).json({ message: 'Object name required' });

  const datasetPath = path.join(datasetsDir, objectName);
  if (!fs.existsSync(datasetPath)) {
    return res.status(404).json({ message: 'Dataset not found. Upload dataset first.' });
  }

  if (trainingStatus.running) {
    return res.status(400).json({ message: 'Training already in progress' });
  }

  // Python training script path (you must create this)
  const trainScript = path.join(__dirname, '../scripts/train_yolo.py');
  if (!fs.existsSync(trainScript)) {
    return res.status(500).json({ message: 'Training script not found at ' + trainScript });
  }

  trainingStatus = { running: true, log: [], objectName };
  trainingMetrics[objectName] = { status: 'training', startTime: Date.now() };

  // Spawn Python training process
  const pythonExe = process.env.PYTHON_EXECUTABLE || 'python';
  // Use default epochs=100 with early stopping, batch=16
  const args = [
    trainScript,
    '--data', datasetPath,
    '--epochs', '100',
    '--batch', '16',
    '--patience', '10', // early stopping patience
    '--output', modelsDir,
    '--name', objectName
  ];

  const proc = spawn(pythonExe, args);

  proc.stdout.on('data', (data) => {
    const msg = data.toString();
    trainingStatus.log.push(msg);
    
    // Parse metrics from output (example: "Epoch 10/50, Loss: 0.123, Accuracy: 0.95")
    const epochMatch = msg.match(/Epoch (\d+)\/(\d+)/);
    const lossMatch = msg.match(/Loss:\s*([\d.]+)/);
    const accMatch = msg.match(/Accuracy:\s*([\d.]+)/);
    
    if (epochMatch || lossMatch || accMatch) {
      if (!trainingMetrics[objectName]) trainingMetrics[objectName] = {};
      if (epochMatch) {
        trainingMetrics[objectName].currentEpoch = parseInt(epochMatch[1]);
        trainingMetrics[objectName].totalEpochs = parseInt(epochMatch[2]);
      }
      if (lossMatch) trainingMetrics[objectName].loss = parseFloat(lossMatch[1]);
      if (accMatch) trainingMetrics[objectName].accuracy = parseFloat(accMatch[1]);
    }
    console.log(`Training stdout: ${msg}`);
  });

  proc.stderr.on('data', (data) => {
    const msg = data.toString();
    trainingStatus.log.push(`ERROR: ${msg}`);
    console.error(`Training stderr: ${msg}`);
  });

  proc.on('close', (code) => {
    trainingStatus.running = false;
    if (code === 0) {
      trainingStatus.log.push(`Training completed successfully for ${objectName}`);
      trainingMetrics[objectName] = {
        ...trainingMetrics[objectName],
        status: 'completed',
        endTime: Date.now()
      };
      
      // Mark product as trained in database
      Product.findOneAndUpdate({ name: objectName }, { trained: true }).catch(console.error);
    } else {
      trainingStatus.log.push(`Training failed with code ${code}`);
      trainingMetrics[objectName] = {
        ...trainingMetrics[objectName],
        status: 'failed',
        endTime: Date.now()
      };
    }
  });

  res.json({ message: 'Training started', objectName });
});

// GET /admin/ai-models/training-status -> check training status
router.get('/training-status', (_req, res) => {
  res.json(trainingStatus);
});

module.exports = router;
