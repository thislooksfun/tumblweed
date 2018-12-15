"use strict";

const extractName = pquire("url/extract-name");
const Crawler = pquire("crawler");
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
  
  static get(name) {
    return blogs[name];
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
    this._crawler = new Crawler(this, this.name);
    return this._crawler.start();
  }
  
  pause() {
    this.state = "pausing";
    this._crawler.pause()
      .then(() => this.state = "paused");
  }
  resume() {
    this.state = "starting";
    this._crawler.resume();
  }
  cancel() {
    this.state = "stopping";
    this._crawler.cancel();
  }
  
  startBlog(blgInfo, pageSize) {
    this.state = "running";
    console.log(`Starting blog ${blgInfo.name}`);
    this._init();
    
    this._totalPosts = blgInfo.total_posts;
    this._totalPages = Math.ceil(blgInfo.total_posts / pageSize);
  }
  
  finishBlog() {
    // this.state = "done";
    this.state = "ready";
    let anyInProgress = false;
    for (const blog in blogs) {
      if (blogs[blog].state !== "ready") {
        anyInProgress = true;
        break;
      }
    }
    status.busy = anyInProgress;
  }
  
  
  startPage() {
    this.state = "running";
    console.log(`Starting page ${this._finishedPages + 1}/${this._totalPages}`);
  }
  
  finishPage() {
    this._finishedPages++;
    console.log(`Finished ${this._finishedPages}/${this._totalPages} pages`);
  }
  
  
  startPost(post) {
    this.state = "running";
    console.log(`Starting post ${this._finishedPosts + 1}/${this._totalPosts}`);
    
    this._totalDownloadsForPost = post.meta.files.length;
  }
  
  finishPost() {
    this._finishedPosts++;
    this.update();
    console.log(`Finished ${this._finishedPosts}/${this._totalPosts} posts`);
  }
};
