const express = require("express");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");
const router = express.Router();

const Order = require('../models/Order');

let webotsProcess = null;
const SUPERVISOR_PORT = 10020;
const MAPPING_SERVER_PORT = 10022;
const COMPLETION_SERVER_PORT = 10023;

let webotsLogs = [];
const MAX_LOGS = 200;

// Track order product counts
const orderProductCounts = {};

// ==================== HELPER FUNCTIONS ====================

const addLog = (message, type = 'default') => {
  const log = {
    timestamp: new Date().toISOString(),
    message,
    type
  };
  webotsLogs.push(log);
  if (webotsLogs.length > MAX_LOGS) {
    webotsLogs = webotsLogs.slice(-MAX_LOGS);
  }
}

const findExecutable = (exe) =>
  new Promise((resolve) => {
    if (!exe) return resolve(null);
    if (path.isAbsolute(exe) || exe.includes(path.sep)) {
      if (fs.existsSync(exe)) return resolve(path.resolve(exe));
      return resolve(null);
    }
    const cmd = process.platform === "win32" ? `where ${exe}` : `which ${exe}`;
    exec(cmd, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      const found = stdout.split(/\r?\n/).find(Boolean);
      resolve(found ? found.trim() : null);
    });
  });

const sendToSupervisor = (command) => {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(SUPERVISOR_PORT, 'localhost', () => {
      console.log(`📡 Connected to supervisor, sending: ${command}`);
      client.write(command);
    });

    client.on('data', (data) => {
      console.log(`📥 Supervisor response: ${data}`);
      client.destroy();
      resolve(data.toString());
    });

    client.on('error', (err) => {
      console.error('❌ Supervisor connection error:', err.message);
      reject(err);
    });

    setTimeout(() => {
      client.destroy();
      reject(new Error('Supervisor connection timeout'));
    }, 5000);
  });
};

// ✅ FIXED: Added priority and products parameters
const updateOrderMapping = (orderId, crateNumber, productCount, priority = 0, products = []) => {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(MAPPING_SERVER_PORT, 'localhost', () => {
      // ✅ NEW: Include product names in the mapping
      const productsStr = products.join(',');
      console.log(`📡 Updating order mapping: ${orderId} → Crate ${crateNumber}`);
      console.log(`   Products: ${productsStr} (${productCount} total)`);
      console.log(`   Priority: ${priority}`);
      // Format: UPDATE:ORDERID:CRATE:TOTAL:PRIORITY:PRODUCT1,PRODUCT2,PRODUCT3
      client.write(`UPDATE:${orderId}:${crateNumber}:${productCount}:${priority}:${productsStr}`);
    });

    client.on('data', (data) => {
      const response = data.toString();
      console.log(`📥 Mapping server response: ${response}`);
      client.destroy();
      
      if (response === 'OK') {
        resolve(response);
      } else {
        reject(new Error(`Mapping server returned: ${response}`));
      }
    });

    client.on('error', (err) => {
      console.error('❌ Mapping server connection error:', err.message);
      reject(err);
    });

    setTimeout(() => {
      client.destroy();
      reject(new Error('Mapping server connection timeout'));
    }, 5000);
  });
};

// Start completion listener server
const startCompletionListener = () => {
  const server = net.createServer((socket) => {
    console.log('🔌 Completion listener: Client connected');
    
    socket.on('data', async (data) => {
      try {
        const message = data.toString().trim();
        console.log(`\n📥 COMPLETION NOTIFICATION: ${message}`);
        
        if (message.startsWith('COMPLETED:')) {
          const orderId = message.split(':')[1];
          console.log(`✅ Order ${orderId} completed, updating status...`);
          
          // Find order by short ID
          const orders = await Order.find({ 
            status: { $in: ['Processing', 'in transit'] } 
          });
          
          const matchingOrder = orders.find(o => 
            orderId.includes(o._id.toString().slice(-8).toUpperCase())
          );
          
          if (matchingOrder) {
            matchingOrder.status = 'Completed';
            await matchingOrder.save();
            console.log(`✅ Order ${matchingOrder._id} marked as Completed`);
            addLog(`Order ${orderId} completed and marked as Completed`, "success");
            socket.write('ACK');
          } else {
            console.log(`⚠️ Order not found: ${orderId}`);
            socket.write('NOT_FOUND');
          }
        }
      } catch (err) {
        console.error('❌ Error handling completion:', err);
        socket.write('ERROR');
      }
    });
  });
  
  server.listen(COMPLETION_SERVER_PORT, '0.0.0.0', () => {
    console.log(`🎯 Completion listener running on port ${COMPLETION_SERVER_PORT}`);
  });
  
  return server;
};

// Start completion listener on module load
let completionServer = null;
if (!completionServer) {
  completionServer = startCompletionListener();
}

// ==================== ROUTES ====================

router.post("/start", async (req, res) => {
  try {
    if (webotsProcess && !webotsProcess.killed) {
      addLog("Webots is already running", "info");
      return res.json({ started: true, message: "Webots already running" });
    }

    const configured = process.env.WEBOTS_EXECUTABLE || "webots";
    console.log("🔍 Trying to find Webots executable:", configured);
    const exePath = await findExecutable(configured);

    if (!exePath) {
      console.error("❌ Webots executable not found. WEBOTS_EXECUTABLE:", configured);
      return res.status(500).json({
        started: false,
        error:
          `Webots executable not found. Tried "${configured}". ` +
          `Set WEBOTS_EXECUTABLE environment variable to the full path.`
      });
    }

    console.log("✅ Found Webots at:", exePath);

    const wbtFile = process.env.WEBOTS_WBT_PATH || "C:\\Maaz\\Webots Project\\warehouse_apperance_2.wbt";
    console.log("🔍 Looking for WBT file:", wbtFile);

    if (!fs.existsSync(wbtFile)) {
      console.error("❌ WBT file not found:", wbtFile);
      return res.status(500).json({
        started: false,
        error: `WBT file not found at "${wbtFile}". Set WEBOTS_WBT_PATH env var.`,
      });
    }

    addLog("Starting Webots simulation...", "info");
    console.log("🚀 Starting Webots with:", { exePath, wbtFile });

    webotsProcess = spawn(exePath, [
      wbtFile,
      "--port=1234",
      "--stream",
      "--batch",
      "--stdout",
      "--stderr",
    ]);

    webotsProcess.stdout.on("data", (data) => {
      const message = `${data}`.trim();
      console.log(`Webots stdout: ${message}`);
      addLog(message, "default");
    });
    
    webotsProcess.stderr.on("data", (data) => {
      const message = `${data}`.trim();
      console.error(`Webots stderr: ${message}`);
      addLog(message, "error");
    });
    
    webotsProcess.on("close", (code) => {
      console.log(`🛑 Webots closed with code ${code}`);
      addLog(`Webots process closed with code ${code}`, code === 0 ? "success" : "error");
      webotsProcess = null;
    });
    
    webotsProcess.on("error", (err) => {
      console.error("❌ Webots process spawn error:", err);
      addLog(`Webots error: ${err.message}`, "error");
      webotsProcess = null;
    });

    setTimeout(() => {
      addLog("Webots started successfully", "success");
      res.json({ started: true, message: "Webots started successfully" });
    }, 3000);
  } catch (err) {
    console.error("❌ Error starting Webots:", err);
    addLog(`Failed to start Webots: ${err.message}`, "error");
    res.status(500).json({ started: false, error: err.message });
  }
});

router.post("/stop", async (req, res) => {
  try {
    if (webotsProcess && !webotsProcess.killed) {
      console.log("🛑 Stopping Webots process...");
      webotsProcess.kill("SIGINT");
      webotsProcess = null;
      addLog("Webots stopped by user", "info");
      return res.json({ stopped: true, message: "Webots stopped successfully" });
    }
    addLog("No Webots process running", "info");
    res.json({ stopped: false, message: "No Webots process running" });
  } catch (err) {
    console.error("❌ Error stopping Webots:", err);
    addLog(`Error stopping Webots: ${err.message}`, "error");
    res.status(500).json({ stopped: false, error: err.message });
  }
});

router.post("/teleoperation/activate", async (req, res) => {
  try {
    if (!webotsProcess || webotsProcess.killed) {
      addLog("Cannot switch to teleoperation: Webots not running", "error");
      return res.status(400).json({ 
        success: false, 
        message: "Webots is not running. Please connect first." 
      });
    }

    addLog("Switching to teleoperation mode...", "info");
    console.log("📡 Sending teleoperation activation command to supervisor");
    
    try {
      const response = await sendToSupervisor("start_teleoperation");
      addLog("✅ Teleoperation mode activated. Use keyboard controls.", "success");
      
      res.json({ 
        success: true, 
        message: "Teleoperation mode activated.",
        response: response
      });
    } catch (err) {
      addLog(`❌ Failed to communicate with supervisor: ${err.message}`, "error");
      return res.status(500).json({
        success: false,
        message: "Failed to communicate with Webots supervisor.",
        error: err.message
      });
    }
  } catch (err) {
    console.error("❌ Error switching to teleoperation:", err);
    addLog(`Error switching to teleoperation: ${err.message}`, "error");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/teleoperation/deactivate", async (req, res) => {
  try {
    if (!webotsProcess || webotsProcess.killed) {
      addLog("Cannot switch to YOLO: Webots not running", "error");
      return res.status(400).json({ 
        success: false, 
        message: "Webots is not running. Please connect first." 
      });
    }

    addLog("Switching back to YOLO controller...", "info");
    console.log("📡 Sending YOLO activation command to supervisor");
    
    try {
      const response = await sendToSupervisor("start_yolo");
      addLog("✅ YOLO controller activated. Automatic sorting resumed.", "success");
      
      res.json({ 
        success: true, 
        message: "YOLO controller activated.",
        response: response
      });
    } catch (err) {
      addLog(`❌ Failed to communicate with supervisor: ${err.message}`, "error");
      return res.status(500).json({
        success: false,
        message: "Failed to communicate with Webots supervisor.",
        error: err.message
      });
    }
  } catch (err) {
    console.error("❌ Error switching to YOLO:", err);
    addLog(`Error switching to YOLO: ${err.message}`, "error");
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ MAIN ROUTE: Send order to Webots - COMPLETE FIXED VERSION
router.post("/send-order/:orderId", async (req, res) => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📥 SEND ORDER REQUEST`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Order ID: ${req.params.orderId}`);
  console.log(`Priority from frontend: ${req.body.priority}`);
  
  try {
    if (!webotsProcess || webotsProcess.killed) {
      console.log("❌ Webots not running");
      addLog("Cannot assign order: Webots not running", "error");
      return res.status(400).json({ 
        success: false, 
        message: "Webots is not running. Please connect first." 
      });
    }

    const { orderId } = req.params;
    const { priority } = req.body;

    // ✅ Validate and ensure priority is a number
    const priorityNum = parseInt(priority) || 0;
    console.log(`✅ Priority parsed as: ${priorityNum} (${priorityNum === 1 ? 'FAST' : 'NORMAL'})`);

    console.log(`📦 Fetching order from database...`);
    
    const order = await Order.findById(orderId).populate('user', 'username email');

    if (!order) {
      console.log(`❌ Order not found: ${orderId}`);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    console.log(`✅ Order found!`);
    console.log(`   Customer: ${order.user?.username || order.user?.email || 'Guest'}`);
    console.log(`   Items: ${order.items?.length || 0}`);
    console.log(`   Total: $${order.total}`);
    console.log(`   Current Status: ${order.status}`);

    if (!order.items || order.items.length === 0) {
      console.log(`❌ Order has no items`);
      return res.status(400).json({ 
        success: false, 
        message: "Order has no items to process" 
      });
    }

    // Calculate total product count
    const totalProducts = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // ✅ Extract unique product names from order items
    const productNames = order.items.map(item => item.name);
    
    // ✅ Use priorityNum for crate assignment
    const crateNumber = priorityNum === 1 ? 1 : 2;
    const orderIdShort = orderId.slice(-8).toUpperCase();
    
    console.log(`\n🎯 ASSIGNMENT:`);
    console.log(`   Order ID: ${orderIdShort}`);
    console.log(`   Priority: ${priorityNum === 1 ? 'FAST (1)' : 'NORMAL (0)'}`);
    console.log(`   Crate: ${crateNumber}`);
    console.log(`   Motion: ${crateNumber}`);
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Products: ${productNames.join(', ')}`);
    
    addLog(`Assigning order ${orderIdShort} to Crate ${crateNumber} (Priority: ${priorityNum})`, "info");
    
    try {
      console.log(`\n📡 Connecting to mapping server (port ${MAPPING_SERVER_PORT})...`);
      // ✅ CRITICAL FIX: Pass priorityNum AND productNames
      await updateOrderMapping(orderIdShort, crateNumber, totalProducts, priorityNum, productNames);
      console.log(`✅ Mapping updated successfully with priority ${priorityNum} and products!`);
      
      addLog(`✅ Order ${orderIdShort} assigned to Motion ${crateNumber} → Crate ${crateNumber} (Priority: ${priorityNum === 1 ? 'FAST' : 'NORMAL'})`, "success");
      
      // ✅ Update order status to "Processing"
      console.log(`\n💾 Updating order status to "Processing"...`);
      order.status = 'Processing';
      order.crateNumber = crateNumber;
      await order.save();
      
      // Track order products
      orderProductCounts[orderIdShort] = {
        expected: totalProducts,
        processed: 0
      };
      
      console.log(`✅ Database updated: status = Processing, crate = ${crateNumber}`);
      console.log(`${"=".repeat(60)}\n`);
      
      res.json({ 
        success: true, 
        message: `Order assigned successfully! Robot will use Motion ${crateNumber} to sort ${totalProducts} products to Crate ${crateNumber}.`,
        crateNumber: crateNumber,
        orderId: orderIdShort,
        products: productNames,
        totalProducts: totalProducts,
        motion: crateNumber,
        details: {
          priority: priorityNum === 1 ? 'Fast' : 'Normal',
          itemCount: order.items.length,
          totalProducts: totalProducts,
          customer: order.user?.username || order.user?.email || 'Guest'
        }
      });
    } catch (err) {
      console.error("\n❌ ERROR communicating with mapping server:", err);
      console.error(`   Error: ${err.message}`);
      addLog(`❌ Failed to assign order: ${err.message}`, "error");
      
      let errorMessage = "Failed to communicate with order mapping server.";
      let helpText = "";
      
      if (err.message.includes('ECONNREFUSED')) {
        errorMessage = "Cannot connect to mapping server (port 10022).";
        helpText = "Please run: python order_mapping.py";
        console.log(`\n💡 SOLUTION: Start the mapping server:`);
        console.log(`   cd c:\\Maaz\\WHR-Sorting`);
        console.log(`   python order_mapping.py`);
      } else if (err.message.includes('timeout')) {
        errorMessage = "Connection to mapping server timed out.";
        helpText = "Ensure order_mapping.py is running on port 10022";
      }
      
      console.log(`${"=".repeat(60)}\n`);
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: err.message,
        help: helpText || "Run: python order_mapping.py"
      });
    }
  } catch (err) {
    console.error("\n❌ CRITICAL ERROR:", err);
    console.error("Stack:", err.stack);
    console.log(`${"=".repeat(60)}\n`);
    addLog(`Error assigning order: ${err.message}`, "error");
    
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: err.message
    });
  }
});

router.get("/logs", (req, res) => {
  try {
    // Only return logs with type "default" (controller logs)
    const controllerLogs = webotsLogs.filter(log => log.type === "default");
    res.json(controllerLogs);
  } catch (err) {
    console.error("❌ Error fetching logs:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/logs", (req, res) => {
  try {
    webotsLogs = [];
    addLog("Logs cleared by user", "info");
    res.json({ cleared: true, message: "Logs cleared successfully" });
  } catch (err) {
    console.error("❌ Error clearing logs:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/test-paths", (req, res) => {
  const testPaths = [
    "C:\\Program Files\\Webots\\webots.exe",
    "C:\\Program Files\\Webots\\msys64\\mingw64\\bin\\webots.exe",
    "C:\\Program Files (x86)\\Webots\\webots.exe",
    process.env.WEBOTS_EXECUTABLE,
  ];

  const results = testPaths.map(p => ({
    path: p,
    exists: p ? fs.existsSync(p) : false
  }));

  res.json({
    results,
    env: {
      WEBOTS_EXECUTABLE: process.env.WEBOTS_EXECUTABLE,
      WEBOTS_WBT_PATH: process.env.WEBOTS_WBT_PATH,
    },
    webotsRunning: webotsProcess && !webotsProcess.killed,
    completionServerRunning: completionServer && completionServer.listening
  });
});

module.exports = router;