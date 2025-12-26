const express = require('express');
const router = express.Router();
const WebSocket = require('ws');

let webotsWs = null;
let environmentConfig = {
  conveyorBelt: { length: 5.0, width: 0.8, speed: 0.5 },
  arena: { length: 10.0, width: 10.0, height: 3.0 },
  objects: []
};

// GET current environment config
router.get('/config', (req, res) => {
  res.json(environmentConfig);
});

// POST update environment config
router.post('/config', (req, res) => {
  try {
    const { conveyorBelt, arena, objects } = req.body;
    if (conveyorBelt) environmentConfig.conveyorBelt = { ...environmentConfig.conveyorBelt, ...conveyorBelt };
    if (arena) environmentConfig.arena = { ...environmentConfig.arena, ...arena };
    if (objects) environmentConfig.objects = objects;

    // Send to Webots via WebSocket if connected
    if (webotsWs && webotsWs.readyState === WebSocket.OPEN) {
      webotsWs.send(JSON.stringify({ type: 'UPDATE_ENV', data: environmentConfig }));
    }

    res.json({ message: 'Configuration updated', config: environmentConfig });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update config', error: err.message });
  }
});

// POST connect to Webots WebSocket
router.post('/connect', (req, res) => {
  try {
    const wsUrl = req.body.wsUrl || 'ws://localhost:1234';
    
    if (webotsWs && webotsWs.readyState === WebSocket.OPEN) {
      return res.json({ connected: true, message: 'Already connected' });
    }

    webotsWs = new WebSocket(wsUrl);

    webotsWs.on('open', () => {
      console.log('WebSocket connected to Webots');
      res.json({ connected: true, message: 'Connected to Webots' });
    });

    webotsWs.on('message', (data) => {
      console.log('Received from Webots:', data.toString());
    });

    webotsWs.on('error', (err) => {
      console.error('WebSocket error:', err);
      webotsWs = null;
    });

    webotsWs.on('close', () => {
      console.log('WebSocket disconnected');
      webotsWs = null;
    });

  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// POST disconnect WebSocket
router.post('/disconnect', (req, res) => {
  if (webotsWs) {
    webotsWs.close();
    webotsWs = null;
    res.json({ disconnected: true });
  } else {
    res.json({ disconnected: false, message: 'Not connected' });
  }
});

// GET WebSocket connection status
router.get('/status', (req, res) => {
  res.json({
    connected: webotsWs && webotsWs.readyState === WebSocket.OPEN,
    readyState: webotsWs ? webotsWs.readyState : null
  });
});

module.exports = router;
