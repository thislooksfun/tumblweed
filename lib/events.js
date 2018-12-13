"use strict";

const DownloadManager = pquire("util/download-manager");
const ipc = require("electron").ipcMain;

ipc.on("add-blog", (e, name) => {
  log.trace(`Adding blog ${name}`);
  try {
    const dm = DownloadManager.new(name, (dm) => e.sender.send("state-change", name, dm.state));
    e.sender.send("add-blog-succeeded", name, dm.state);
  } catch (err) {
    e.sender.send("add-blog-failed", err.message);
  }
});

ipc.on("button-pressed", (e, name, button) => {
  console.log(`Pressed ${button} for ${name}`);
  // TODO
});


let win = null;
module.exports = {
  get win() { return win; },
  set win(w) { win = w; },
  
  send(evt, ...args) {
    win.webContents.send(evt, ...args);
  }
};