"use strict";

global.pquire = require("pquire").withBaseRelative("./lib");
global.log = require("tlf-log");

log._setLevel("debug");

// const { app, BrowserWindow } = require("electron");
const DownloadManager = pquire("util/download-manager");

// let win;
//
// function createWindow () {
//   // Create the browser window.
//   win = new BrowserWindow({ width: 800, height: 600 });
//
//   // and load the index.html of the app.
//   win.loadFile("index.html");
// }
//
// app.on("ready", createWindow);

(async function() {
  const dlmg = new DownloadManager();
  // TODO: add progress indicators to UI
  await dlmg.crawl("https://<blog>.tumblr.com/");
})();