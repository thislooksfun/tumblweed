"use strict";

global.pquire = require("pquire").withBaseRelative("./lib");
global.log = require("tlf-log");

log._setLevel("debug");

const {app, BrowserWindow, dialog} = require("electron");
const status = pquire("status");
const cache = pquire("cache");
// Just needs to be required to run setup
pquire("events");

app.on("ready", () => {
  // Configure menu
  pquire("menu");
  
  pquire("update");
  
  cache.win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    backgroundColor: "#333",
    titleBarStyle: "hiddenInset",
  });
  cache.win.once("ready-to-show", () => {
    cache.win.show();
  });

  cache.win.loadFile("web/index.html");
  // cache.win.openDevTools();
  
  cache.win.on("close", (e) => {
    // Bypass check if nothing is happening
    if (status.idle) { return; }
    
    // Not idle, abort for now
    e.preventDefault();
    
    const opts = {
      type: "warning",
      buttons: ["Yes", "No"],
      defaultId: 1,
      cancelId: 1,
      title: "Confirm",
      message: "Are you sure you want to quit? This will cancel all downloads."
    };
    
    dialog.showMessageBox(cache.win, opts, (choice) => {
      if (choice === 0) {
        // Bypass idle check
        status.idle = true;
        cache.win.destroy();
        cache.win = null;
      }
    });
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});