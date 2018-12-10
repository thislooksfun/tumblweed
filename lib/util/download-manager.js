"use strict";

const extractName = pquire("url/extract-name");
const crawl = pquire("crawler");

module.exports = class DownloadManager {
  constructor() {
    this._init();
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
  
  crawl(blog) {
    return crawl(extractName(blog), this);
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