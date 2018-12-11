"use strict";

global.pquire = require("pquire").withBaseRelative("./lib");
global.log = require("tlf-log");

log._setLevel("debug");

const {app, BrowserWindow, dialog} = require("electron");
const status = pquire("status");

app.on("ready", () => {
  const win = new BrowserWindow({
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
  
  win.on("close", e => {
    // Bypass check if nothing is happening
    if (status.idle) { return; }
    
    let choice = dialog.showMessageBox(
      win,
      {
        type: "warning",
        buttons: ["Yes", "No"],
        defaultId: 1,
        cancelId: 1,
        title: "Confirm",
        message: "Are you sure you want to quit? This will cancel all downloads."
      }
    );
    if (choice === 1) {
      e.preventDefault();
    }
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});