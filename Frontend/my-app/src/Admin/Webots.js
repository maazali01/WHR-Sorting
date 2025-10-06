import React, { useEffect, useRef, useCallback, useState } from "react";
import "./Webots.css";

const WEBOTS_SCRIPT_SRC = "https://cyberbotics.com/wwi/R2025a/WebotsView.js";
const DEFAULT_THUMBNAIL =
  "https://cyberbotics.com/wwi/R2025a/images/loading/default_thumbnail.png";

// singletons to persist across re-renders and route changes
let webotsViewInstance = null;
let disconnectTimeout = null;

const WebotsViewer = () => {
  const ipRef = useRef(null);
  const modeRef = useRef(null);
  const broadcastRef = useRef(null);
  const connectBtnRef = useRef(null);
  const webotsContainerRef = useRef(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load the Webots script once
  useEffect(() => {
    if (document.querySelector(`script[src="${WEBOTS_SCRIPT_SRC}"]`)) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = WEBOTS_SCRIPT_SRC;
    script.type = "module";
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Disconnect logic
  const disconnectWebots = useCallback(() => {
    if (webotsViewInstance && typeof webotsViewInstance.close === "function") {
      try {
        webotsViewInstance.close();
      } catch (err) {
        console.warn("Error closing WebotsView:", err);
      }
      if (connectBtnRef.current) connectBtnRef.current.innerText = "Connect";
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
      disconnectTimeout = null;
      setLoading(false);
    }
  }, []);

  // Connect logic
  const connectToWebots = useCallback(async () => {
    if (
      !ipRef.current ||
      !modeRef.current ||
      !broadcastRef.current ||
      !connectBtnRef.current ||
      !webotsViewInstance
    )
      return;

    if (typeof webotsViewInstance.connect !== "function") {
      console.warn("WebotsView.js not fully loaded yet.");
      return;
    }

    const connectButton = connectBtnRef.current;
    const streamingMode = modeRef.current.value || "w3d";

    // Wait until custom element is fully defined
    if (window.customElements && window.customElements.whenDefined) {
      await window.customElements.whenDefined("webots-view");
    }

    // Setup callbacks
    webotsViewInstance.onready = () => {
      setLoading(false);
      connectButton.innerText = "Disconnect";
      connectButton.onclick = disconnectWebots;
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
      disconnectTimeout = setTimeout(() => {
        console.log("Auto disconnect after 1h inactivity");
        disconnectWebots();
      }, 60 * 60 * 1000);
    };

    webotsViewInstance.ondisconnect = () => {
      connectButton.innerText = "Connect";
      connectButton.onclick = connectToWebots;
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
      disconnectTimeout = null;
      setLoading(false);
    };

    webotsViewInstance.onerror = (err) => {
      console.error("Webots viewer error:", err);
      alert("Connection error / missing file. Check server or console logs.");
      disconnectWebots();
    };

    try {
      setLoading(true);
      webotsViewInstance.connect(
        ipRef.current.value,
        streamingMode,
        broadcastRef.current.checked,
        false,
        -1,
        DEFAULT_THUMBNAIL
      );
    } catch (err) {
      console.error("Connect call failed:", err);
      alert(
        "Failed to start Webots streaming. Check server and ensure it serves binary data correctly."
      );
      setLoading(false);
    }
  }, [disconnectWebots]);

  // Create <webots-view> once and persist globally
  useEffect(() => {
    if (!scriptLoaded) return;

    // create once globally
    if (!webotsViewInstance) {
      const element = document.createElement("webots-view");
      element.setAttribute("thumbnail", DEFAULT_THUMBNAIL);
      element.style.width = "100%";
      element.style.height = "100%";
      document.body.appendChild(element); // keep globally
      webotsViewInstance = element;
    }

    // re-append to this container if needed
    if (
      webotsContainerRef.current &&
      webotsViewInstance.parentNode !== webotsContainerRef.current
    ) {
      webotsContainerRef.current.appendChild(webotsViewInstance);
    }

    if (connectBtnRef.current) {
      connectBtnRef.current.onclick = connectToWebots;
    }

    // Clean up on unmount: only clear timeout, don't disconnect
    return () => {
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
    };
  }, [scriptLoaded, connectToWebots]);

  // Global logout event
  useEffect(() => {
    const handleLogout = () => disconnectWebots();
    window.addEventListener("adminLogout", handleLogout);
    return () => window.removeEventListener("adminLogout", handleLogout);
  }, [disconnectWebots]);

  return (
    <div className="webots-page">
      <header className="webots-header">
        <div className="webots-title">
          <img
            src="https://cyberbotics.com/assets/images/webots.png"
            alt="Webots"
          />
          <h1>Webots Streaming Viewer</h1>
        </div>
        <div className="connect-panel">
          <input
            ref={ipRef}
            type="text"
            defaultValue="ws://localhost:1234"
            className="ip-input"
          />
          <select ref={modeRef} className="mode-select">
            <option value="w3d">W3D</option>
            <option value="mjpeg">MJPEG</option>
          </select>
          <label className="checkbox">
            <input ref={broadcastRef} type="checkbox" /> Broadcast
          </label>
          <button ref={connectBtnRef} className="connect-btn">
            Connect
          </button>
        </div>
      </header>

      <div className="viewer-container">
        <div className="viewer-wrapper" ref={webotsContainerRef}></div>
        {loading && (
          <div className="viewer-loader">
            <div className="spinner"></div>
            <p>Loading stream…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebotsViewer;
