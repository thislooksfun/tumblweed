"use strict";

const Promise = require("bluebird");
const fetchBlog = pquire("api/fetch-blog");
const fetchPage = pquire("api/fetch-page");
const download = pquire("grab/download");


module.exports = class Crawler {
  constructor(dm, blog) {
    this.dm = dm;  // 'dm' == 'DownloadManager'
    this.blog = blog;
    this._running = false;
    this._paused = false;
    this._cancelled = false;
    
    this._pageIndex = -1;
    this._postIndex = -1;
    this._failures = [];
  }
  
  
  async start() {
    if (this._cancelled) {
      throw new Error("Can't re-start a cancelled Crawler!");
    }
    if (this._running) {
      this._paused = false;
      return;
    } else if (this._paused) {
      this.resume();
      return;
    }
    
    this._pageSize = fetchPage.pageSize;
    this._blogInfo = await fetchBlog(this.blog);
    log.info(`Downloading ${this._blogInfo.total_posts} posts`);
    
    await this._process();
  }
  
  
  async _process() {
    let page = null;
    let pi = 0;
    
    const info = await fetchBlog(this.blog);
    log.info(`Downloading ${info.total_posts} posts`);
    
    const pageSize = fetchPage.pageSize;
    
    let failed = [];
    
    this.dm.startBlog(info, pageSize);
    
    pages:
    do {
      this.dm.startPage();
      
      page = await fetchPage(this.blog, pi++);
      for (const post of page) {
        if (this._paused) {
          this._onPaused();
          // Wait to be resumed
          const _self = this;
          await new Promise((resolve) => this.resume = () => {
            _self._paused = false;
            resolve();
          });
        }
        if (this._cancelled) {
          break pages;
        }
        
        this.dm.startPost(post);
        
        const fld = await download(post, this.blog);
        const failures = fld.filter((e) => e != null);
        if (failures.length > 0) {
          failed.push({post: post.meta.id, errors: failures});
        }
        
        this.dm.finishPost();
      }
      
      this.dm.finishPage();
    
    // Stop when the length of the page is less than the max
    // this will only happen on the last page
    } while (page.length == pageSize);
    
    console.log(`${failed.length} post${failed.length == 1 ? "" : "s"} had failed downloads:`);
    console.log(failed);
    
    this.dm.finishBlog();
  }
  
  
  async pause() {
    await new Promise((resolve) => {
      this._onPaused = resolve;
      this._paused = true;
    });
  }
  
  cancel() {
    this._cancelled = true;
    if (this._paused) {
      // If the crawler is paused it won't check if it has been cancelled,
      // so we need to resume it first. This is safe to do becasuse '_paused'
      // is always checked before '_cancelled', so resuming here immediately
      // goes into the '_cancelled' check, and stops the crawler, without any
      // more downloads happening.
      this.resume();
    }
  }
};