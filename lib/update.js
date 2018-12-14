"use strict";

const {ipcMain} = require("electron");
const {autoUpdater} = require("electron-updater");
const events = pquire("events");

// When the update has been downloaded and is ready to be installed, notify the BrowserWindow
autoUpdater.on("update-downloaded", () => events.send("updateReady"));

// When receiving a quitAndInstall signal, quit and install the new version
ipcMain.on("quitAndInstall", () => autoUpdater.quitAndInstall());

// Check for updates
autoUpdater.checkForUpdates();