"use strict";

const extractName = pquire("url/extract-name");
const Crawler = pquire("crawler");
const status = pquire("status");

const blogs = {};

const phaseItems = ["post", "avatar", "header image"];
const phases = ["posts", "avatars", "header images"];

module.exports = class DownloadManager {
  
  get state() { return this._state; }
  set state(s) {
    this._state = s;
    this.update();
  }
  
  get progress() {
    return {
      phase: this._phase + 1,
      phases: phases.length,
      phase_name: phases[this._phase],
      total: this._total,
      done: this._finished,
    };
  }
  
  static new(name, update, finish) {
    name = extractName(name);
    if (blogs.hasOwnProperty(name)) {
      throw new Error(`${name}.tumblr.com already exists!`);
    }
    
    const dm = new DownloadManager(name, update, finish);
    blogs[name] = dm;
    return dm;
  }
  
  static get(name) {
    return blogs[name];
  }
  
  constructor(name, update, finish) {
    this._init();
    this.name = name;
    this.url = `https://${name}.tumblr.com`;
    this._state = "ready";
    this.update = update.bind(null, this);
    this.finish = finish.bind(null, this);
    
    this.update();
  }
  
  _init() {
    this._totalPages = 0;
    this._finishedPages = 0;
    
    this._total = 0;
    this._finished = 0;
    
    this._totalDownloadsForPost = 0;
    this._finishedDownloadsForPost = 0;
    
    this._totalfileSize = 0;
    this._downloadedFileSize = 0;
    
    this._phase = 0;
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
    
    this._total = blgInfo.total_posts;
    this._totalPages = Math.ceil(blgInfo.total_posts / pageSize);
  }
  
  finishBlog(totalFailures) {
    log.trace(`Finished downloading ${this.name}`);
    
    // this.state = "done";
    this.state = "ready";
    let anyInProgress = false;
    for (const blog in blogs) {
      if (blogs[blog].state !== "ready") {
        anyInProgress = true;
        break;
      }
    }
    
    this.errorCount = totalFailures;
    this.finish();
    
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
  
  
  startItem() {
    this.state = "running";
    console.log(`Starting ${phaseItems[this._phase]} ${this._finished + 1}/${this._total}`);
  }
  
  finishItem() {
    this._finished++;
    this.update();
    console.log(`Finished ${this._finished}/${this._total} posts`);
  }
  
  
  nextPhase(items) {
    this._phase++;
    log.trace(`Starting phase ${this._phase}: ${phases[this._phase]}`);
    this._total = items;
    this._finished = 0;
  }
};
