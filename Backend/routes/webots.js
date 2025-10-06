// routes/webots.js
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();

let webotsProcess = null;

router.post("/start", async (req, res) => {
  try {
    // Prevent multiple processes
    if (webotsProcess && !webotsProcess.killed) {
      return res.json({ started: true, message: "Webots already running" });
    }

    const webotsExe = "webots"; // or full path to webots.exe if not in PATH
    const wbtFile =
      "C:\\Users\\Dev\\Downloads\\Webots Project\\warehouse_apperance_2.wbt";

    // Spawn the Webots process
    webotsProcess = spawn(webotsExe, [
      wbtFile,
      "--port=1234",
      "--stream",
      "--batch",
      "--stdout",
      "--stderr",
    ]);

    webotsProcess.stdout.on("data", (data) =>
      console.log(`Webots stdout: ${data}`)
    );
    webotsProcess.stderr.on("data", (data) =>
      console.error(`Webots stderr: ${data}`)
    );
    webotsProcess.on("close", (code) => {
      console.log(`Webots closed with code ${code}`);
      webotsProcess = null;
    });

    res.json({ started: true, message: "Webots started" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ started: false, error: err.message });
  }
});

router.post("/stop", async (req, res) => {
  if (webotsProcess && !webotsProcess.killed) {
    webotsProcess.kill("SIGINT");
    webotsProcess = null;
    return res.json({ stopped: true });
  }
  return res.json({ stopped: false, message: "No Webots process running" });
});

module.exports = router;
