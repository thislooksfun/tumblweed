"use strict";

const url = require("url");

// Extract <name> from: http(s)://<name>.tumblr.com/<path>
module.exports = function(u) {
  const {host} = url.parse(u.startsWith("http") ? u : `https://${u}`);
  if (host == null) {
    return null;
  } else if (host.endsWith(".tumblr.com")) {
    return host.slice(0, -11);
  } else {
    return host;
  }
};