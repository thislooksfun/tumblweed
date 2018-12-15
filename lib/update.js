"use strict";

const {ipcMain} = require("electron");
const {autoUpdater} = require("electron-updater");
const events = pquire("events");

// Pass events to the window
autoUpdater.on("update-available",     (e) => events.send("update-available", e));
autoUpdater.on("download-progress",    (e) => events.send("update-download-progress", e));
autoUpdater.on("update-downloaded",    (e) => events.send("update-downloaded", e));
autoUpdater.on("update-not-available", ()  => events.send("update-not-available"));

// Tell electron-updater to perform the install
ipcMain.on("quit-and-install", () => autoUpdater.quitAndInstall());


// Check for updates
autoUpdater.checkForUpdates();