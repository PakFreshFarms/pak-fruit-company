// Electron wrapper for Mandi Hisab. Spawns the already-built Next.js app
// (`npm run build` in the project root beforehand) as a local server, waits
// for it to come up, then opens it in a native window. Closing the window
// stops the server. Intended to be packaged with electron-builder into a
// normal Windows .exe with a Start Menu / desktop shortcut — see the
// "Desktop app (optional)" section of the project README for setup.

const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

let serverProcess;
let mainWindow;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) reject(new Error("Timed out waiting for the app server to start"));
          else setTimeout(tryOnce, 400);
        });
    };
    tryOnce();
  });
}

function startServer() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  serverProcess = spawn(npmCmd, ["start"], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Mandi Hisab",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(URL);
}

app.whenReady().then(async () => {
  startServer();
  try {
    await waitForServer(URL);
  } catch (err) {
    console.error(err);
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
