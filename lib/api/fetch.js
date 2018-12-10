"use strict";

const rp = require("request-promise");
const Promise = require("bluebird");

const settings = pquire("settings");

// Split this out for easy changing later, if necessary.
function formatURL(blogName, endpoint, options, needsAPIKey) {
  options = options || {};
  
  if (needsAPIKey) {
    options.api_key = options.api_key || settings.get("api_key");
    if (options.api_key == null) {
      log.fatal("No API key");
    }
  }
  
  const params = Object.keys(options).map(k => k + "=" + encodeURIComponent(options[k])).join("&");
  const base = `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/${endpoint}`;
  
  return (params === "") ? base : `${base}?${params}`;
}

module.exports = function(blogName, endpoint, options, needsAPIKey = true) {
  const url = formatURL(blogName, endpoint, options, needsAPIKey);
  log.debug(`Fetching ${url} from ${blogName}`);
  
  const timeout = settings.get("timeout") * 1000;
  
  return Promise
    .resolve()
    .then(() => rp({uri: url, timeout: timeout}))
    .then(JSON.parse)
  ;
};

module.exports.url = formatURL;