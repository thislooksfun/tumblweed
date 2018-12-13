"use strict";

const extractName = pquire("url/extract-name");
const crawl = pquire("crawler");
const status = pquire("status");

const blogs = {};

module.exports = class DownloadManager {
  
  get state() { return this._state; }
  set state(s) {
    this._state = s;
    this.update();
  }
  
  static new(name, update) {
    name = extractName(name);
    if (blogs.hasOwnProperty(name)) {
      throw new Error(`${name}.tumblr.com already exists!`);
    }
    
    const dm = new DownloadManager(name, update);
    blogs[name] = dm;
    return dm;
  }
  
  constructor(name, update) {
    this._init();
    this.name = name;
    this.url = `https://${name}.tumblr.com`;
    this._state = "ready";
    this.update = update.bind(null, this);
    this.update();
  }
  
  _init() {
    this._totalPages = 0;
    this._finishedPages = 0;
    
    this._totalPosts = 0;
    this._finishedPosts = 0;
    
    this._totalDownloadsForPost = 0;
    this._finishedDownloadsForPost = 0;
    
    this._totalfileSize = 0;
    this._downloadedFileSize = 0;
  }
  
  download() {
    this.crawl();
  }
  
  crawl() {
    this.state = "starting";
    status.busy = true;
    // return crawl(this.name, this);
    // this.state = "running";
  }
  
  pause() {
    this.state = "pausing";
    throw new Error("Not implemented");
    // this.state = "paused";
  }
  resume() {
    this.state = "starting";
    throw new Error("Not implemented");
    // this.state = "running";
  }
  cancel() {
    this.state = "stopping";
    throw new Error("Not implemented");
    // status.busy = false;
    // this.state = "ready";
  }
  
  startBlog(blgInfo, pageSize) {
    console.log(`Starting blog ${blgInfo.name}`);
    this._init();
    
    this._totalPosts = blgInfo.total_posts;
    this._totalPages = Math.ceil(blgInfo.total_posts / pageSize);
  }
  
  finishBlog() {
    // TODO
  }
  
  
  startPage() {
    console.log(`Starting page ${this._finishedPages + 1}/${this._totalPages}`);
  }
  
  finishPage() {
    this._finishedPages++;
    console.log(`Finished ${this._finishedPages}/${this._totalPages} pages`);
  }
  
  
  startPost(post) {
    console.log(`Starting post ${this._finishedPosts + 1}/${this._totalPosts}`);
    
    this._totalDownloadsForPost = post.files.length;
  }
  
  finishPost() {
    this._finishedPosts++;
    console.log(`Finished ${this._finishedPosts}/${this._totalPosts} posts`);
  }
};






/*

// (async function() {
//   const dlmg = new DownloadManager();
//   // TODO: add progress indicators to UI
//   await dlmg.crawl("https://<blog>.tumblr.com/");
// })();

*/
