"use strict";

const rp = require("request-promise");
const request = require("request");
const {StatusCodeError, RequestError} = require("request-promise/errors");
const fs = require("fs-extra");
const path = require("path");
const url = require("url");
const Promise = require("bluebird");
const {pluralize} = pquire("util/helpers");

const settings = pquire("settings");

function getExt(type) {
  if (type.startsWith("video/")) {
    return type.slice(6);
  } else if (type.startsWith("image/")) {
    return type.slice(6);
  } else if (type.startsWith("audio/")) {
    return type.slice(6);
  } else {
    throw new Error(`Unsupported source type ${type}`);
  }
}

function download(mediaDir, {folder, uri}) {
  if (uri.startsWith("//")) {
    uri = "http:" + uri;
  }
  log.debug(`Downloading ${uri}`);
  const overwrite = settings.get("overwrite");
  
  const timeout = settings.get("timeout") * 1000;
  
  return Promise
    .resolve()
    .then(() => rp.head({uri: uri, resolveWithFullResponse: true, timeout: timeout}))
    .then((res) => {
      const pth = url.parse(uri).path;
      const filename = path.parse(pth).name;
      
      const type = res.headers["content-type"];
      const ext = getExt(type);
      return [
        path.join(mediaDir, folder, ext),
        `${filename}.${ext}`
      ];
    })
    .tap(([dir]) => fs.ensureDir(dir))
    .then(([dir, fname]) => {
      const dest = path.join(dir, fname);
      if (!overwrite && fs.existsSync(dest)) {
        log.debug(`${dest} already exists, skipping...`);
        return;
      }
      
      return new Promise((resolve, reject) => {
        log.trace(`Downloading ${dest}`);
        request({uri: uri, timeout: timeout})
          .pipe(fs.createWriteStream(dest))
          .on("close", () => {
            log.debug(`Finished downloading ${dest}`);
            resolve(fname);
          })
          .on("error", (err) => {
            reject(err);
          })
        ;
      });
    })
    .return()
    .catch(StatusCodeError, (sce) => ({uri: uri, code: sce.statusCode, msg: sce.message}))
    .catch(RequestError, (rqe) => ({uri: uri, msg: rqe.message}))
    .catch((err) => ({uri: uri, msg: err.message}))
    // .tap(() => log.warn("Oh hi there => " + uri))
  ;
}

function downloadAll(mediaDir, srcArr, beforeEach, afterEach) {
  return Promise
    .map(srcArr, (itm) => {
      return Promise
        .resolve()
        .tap(() => {
          if (typeof(beforeEach) === "function") {
            beforeEach(itm);
          }
        })
        .then(() => download(mediaDir, itm))
        .tap(() => {
          if (typeof(afterEach) === "function") {
            afterEach(itm);
          }
        })
      ;
    }, {concurrency: 5})  // Limit to 5 downloads at a time
  ;
}

module.exports = function(post) {
  const blogName = post.meta.blog_name;
  
  const destDir = settings.get("download_dir");
  const blogDir = path.join(destDir, blogName);
  const compact = settings.get("compact_json");
  const overwrite = settings.get("overwrite");
  const mediaDir = path.join(blogDir, "media");
  const postDir = path.join(blogDir, "posts");
  const metaFile = path.join(postDir, `${post.meta.id}.meta.json`);
  
  if (!overwrite && fs.existsSync(metaFile)) {
    const meta = JSON.parse(fs.readFileSync(metaFile, "utf-8"));
    if (meta.failures.length === 0) {
      log.debug(`Post ${post.meta.id} was already downloaded with no errors. Skipping...`);
      // The code this was called from expects a Promise<Array>
      return Promise.resolve([]);
    } else {
      log.debug(`Post ${post.meta.id} was already downloaded, but had ${pluralize(meta.failures.length, "error")}. Retrying...`);
    }
  }
  
  log.trace(`Downloading post ${post.meta.id} from ${blogName}`);
  log.debug(`Downloading ${pluralize(post.meta.files.length, "file")} from post ${post.meta.id}`);
  
  return downloadAll(mediaDir, post.meta.files)
    // Filter out 'null' and 'undefined'.
    // This is needed because the 'download' function returns null/undefined on success
    // and downloadAll just blindly appends that to the list of failures.
    .then((fld) => fld.filter((e) => e != null))
    .tap(() => {
      const jsonFile = path.join(postDir, `${post.meta.id}.json`);
      
      if (!overwrite && fs.existsSync(jsonFile)) {
        log.debug(`${jsonFile} already exists, skipping...`);
        return;
      }
      
      return fs
        .ensureDir(postDir)
        .then(() => fs.writeFile(jsonFile, JSON.stringify(post.raw, null, compact ? null : 2)))
      ;
    })
    .tap((failures) => {
      post.meta.failures = failures;
      
      if (!overwrite && fs.existsSync(metaFile)) {
        log.debug(`${metaFile} already exists, skipping...`);
        return;
      }
      
      return fs
        .ensureDir(postDir)
        .then(() => fs.writeFile(metaFile, JSON.stringify(post.meta, null, compact ? null : 2)))
      ;
    })
    // .tap(() => console.log("Failed:", failed))
  ;
};

module.exports.all = downloadAll;