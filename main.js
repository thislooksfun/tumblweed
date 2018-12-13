"use strict";

global.pquire = require("pquire").withBaseRelative("./lib");
global.log = require("tlf-log");

log._setLevel("debug");

const {app, BrowserWindow, dialog} = require("electron");
const status = pquire("status");
const events = pquire("events");

let win;

app.on("ready", () => {
  events.win = win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    backgroundColor: "#333",
    titleBarStyle: "hiddenInset",
  });
  win.once("ready-to-show", () => {
    win.show();
  });

  win.loadFile("web/index.html");
  // win.openDevTools();
  
  win.on("close", (e) => {
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
    
    dialog.showMessageBox(win, opts, (choice) => {
      if (choice === 0) {
        // Bypass idle check
        status.idle = true;
        win.destroy();
        win = null;
        events.win = null;
      }
    });
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});