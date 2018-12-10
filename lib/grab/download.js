"use strict";

const rp = require("request-promise");
const request = require("request");
const {StatusCodeError, RequestError} = require("request-promise/errors");
const fs = require("fs-extra");
const path = require("path");
const url = require("url");
const Promise = require("bluebird");

const settings = pquire("settings");

function getExt(type) {
  switch (type) {
    // Images
    case "image/gif": return "gif";
    case "image/jpeg": return "jpeg";
    case "image/png": return "png";
    // Video
    case "video/mp4": return "mp4";
    // Unknown
    default: log.fatal(`Unknown type ${type}`);
  }
}

function download(blogDir, {folder, uri}) {
  if (uri.startsWith("//")) {
    uri = "http:" + uri;
  }
  log.debug(`Downloading ${uri}`);
  const pth = url.parse(uri).path;
  const filename = path.parse(pth).name;
  const overwrite = settings.get("overwrite");
  
  const timeout = settings.get("timeout") * 1000;
  
  return Promise
    .resolve()
    .then(() => rp.head({uri: uri, resolveWithFullResponse: true, timeout: timeout}))
    .then((res) => {
      const type = res.headers["content-type"];
      const ext = getExt(type);
      return [
        path.join(blogDir, "media", folder, ext),
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
      
      return new Promise((resolve) => {
        log.trace(`Downloading ${dest}`);
        request({uri: uri, timeout: timeout})
          .pipe(fs.createWriteStream(dest))
          .on("close", () => {
            log.debug(`Finished downloading ${dest}`);
            resolve(fname);
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

function downloadAll(blogDir, srcArr) {
  return Promise
    .map(srcArr, (itm) => download(blogDir, itm))
  ;
}

module.exports = function(post) {
  const blogName = post.meta.blog_name;
  
  const destDir = settings.get("download_dir");
  const blogDir = path.join(destDir, blogName);
  
  log.trace(`Downloading post ${post.meta.id} from ${blogName}`);
  log.debug(`Downloading ${post.files.length} files from post ${post.meta.id}`);
  
  const compact = settings.get("compact_json");
  const overwrite = settings.get("overwrite");
  
  return downloadAll(blogDir, post.files)
    .then((fld) => fld.filter((e) => e != null))  // Filter out 'null' and 'undefined'
    .tap((failures) => {
      const postDir = path.join(blogDir, "posts");
      const jsonFile = path.join(postDir, `${post.meta.id}.json`);
      
      if (!overwrite && fs.existsSync(jsonFile)) {
        log.debug(`${jsonFile} already exists, skipping...`);
        return;
      }
      
      post.meta.failures = failures;
      
      return fs
        .ensureDir(postDir)
        .then(() => fs.writeFile(jsonFile, JSON.stringify(post.raw, null, compact ? null : 2)))
      ;
    })
    // .tap(() => console.log("Failed:", failed))
  ;
};