"use strict";

const fs = require("fs-extra");
const path = require("path");
const Promise = require("bluebird");
const fetchBlog = pquire("api/fetch-blog");
const fetchPage = pquire("api/fetch-page");
const download = pquire("grab/download");
const settings = pquire("settings");
const dedupe = require("dedupe");


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
    const dm = this.dm;
    
    const info = await fetchBlog(this.blog);
    log.info(`Downloading ${info.total_posts} posts`);
    
    const pageSize = fetchPage.pageSize;
    
    const failed_posts = [];
    
    dm.startBlog(info, pageSize);
    
    let avatars = [];
    let headers = [];
    
    pages:
    do {
      dm.startPage();
      
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
        
        dm.startItem();
        
        avatars.push(...post.meta.referenced_avatars);
        headers.push(...post.meta.referenced_headers);
        
        const fld = await download(post, this.blog);
        const failures = fld.filter((e) => e != null);
        if (failures.length > 0) {
          failed_posts.push({post: post.meta.id, errors: failures});
        }
        
        dm.finishItem();
      }
      
      dm.finishPage();
    
    // Stop when the length of the page is less than the max
    // this will only happen on the last page
    } while (page.length == pageSize);
    
    const destDir = settings.get("download_dir");
    
    
    // Download avatars
    log.trace_("De-duping avatars...");
    avatars = dedupe(avatars);
    log.trace_(" Done");
    
    dm.nextPhase(avatars.length);
    
    log.trace("Downloading avatars...");
    const failed_avatars_raw = await download.all(destDir, avatars, () => dm.startItem(), () => dm.finishItem());
    const failed_avatars = failed_avatars_raw.filter((e) => e != null);
    
    
    // Download headers
    
    log.trace_("De-duping headers...");
    headers = dedupe(headers);
    log.trace_(" Done");
    
    dm.nextPhase(headers.length);
    
    log.trace("Downloading headers...");
    const failed_headers_raw = await download.all(destDir, headers, () => dm.startItem(), () => dm.finishItem());
    const failed_headers = failed_headers_raw.filter((e) => e != null);
    
    
    const blogDir = path.join(destDir, this.blog);
    const compact = settings.get("compact_json");
    const meta = {
      failures: {
        avatars: failed_avatars,
        headers: failed_headers,
        posts: failed_posts,
      }
    };
    const meta_str = JSON.stringify(meta, null, compact ? null : 2);
    fs.writeFileSync(path.join(blogDir, "meta.json"), meta_str);
    
    this.dm.finishBlog(failed_avatars.length + failed_headers.length + failed_posts.length);
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