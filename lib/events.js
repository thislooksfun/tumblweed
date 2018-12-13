"use strict";

const DownloadManager = pquire("util/download-manager");
const ipc = require("electron").ipcMain;

ipc.on("add-blog", (e, name) => {
  log.trace(`Adding blog ${name}`);
  try {
    const dm = DownloadManager.new(name, (dm) => e.sender.send("update-blog", name, dm.state, {total: dm._totalPosts, done: dm._finishedPosts}));
    e.sender.send("add-blog-success", name, dm.state);
  } catch (err) {
    e.sender.send("add-blog-failure", err.message);
  }
});

ipc.on("button-pressed", (e, name, button) => {
  console.log(`Pressed ${button} for ${name}`);
  DownloadManager.get(name)[button]();
});


let win = null;
module.exports = {
  get win() { return win; },
  set win(w) { win = w; },
  
  send(evt, ...args) {
    win.webContents.send(evt, ...args);
  }
};