import {
  app,
  BrowserWindow,
  ipcMain
} from "electron";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { TcpClient } from "./tcp/tcp-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tcpClient = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      preload: path.join(
        __dirname,
        "preload.cjs"
      ),

      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(
    "http://localhost:5173"
  );
}

app.whenReady().then(() => {
  tcpClient = new TcpClient();

  tcpClient.onMessage((message) => {
    if (!mainWindow) {
      return;
    }

    mainWindow.webContents.send(
      "tcp:message",
      message
    );
  });

  tcpClient.onConnectionChange((connected) => {
    if (!mainWindow) {
      return;
    }

    mainWindow.webContents.send(
      "tcp:connection",
      connected
    );
  });

  ipcMain.handle(
    "tcp:connect",
    async (_, host, port) => {
      return tcpClient.connect(
        host,
        port
      );
    }
  );

  ipcMain.handle(
    "tcp:disconnect",
    () => {
      tcpClient.disconnect();
    }
  );

  ipcMain.handle(
    "tcp:send",
    (_, message) => {
      tcpClient.send(message);
    }
  );

  ipcMain.handle(
    "tcp:login",
    (_, username, password) => {
      tcpClient.send({
        type: "LOGIN",
        requestId: randomUUID(),
        payload: {
          username,
          password
        }
      });
    }
  );

  ipcMain.handle(
    "tcp:is-connected",
    () => {
      return tcpClient.isConnected();
    }
  );

  createWindow();

  app.on("activate", () => {
    if (
      BrowserWindow.getAllWindows()
        .length === 0
    ) {
      createWindow();
    }
  });
});

app.on(
  "window-all-closed",
  () => {
    if (
      process.platform !== "darwin"
    ) {
      app.quit();
    }
  }
);