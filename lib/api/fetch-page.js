"use strict";

const format = pquire("post/parse");
const fetch = pquire("fetch");

// Max # of posts per page that the API allows
const pageSize = 20;

module.exports = function(blogName, page) {
  const opts = (process.argv.length > 2) ? {
    id: process.argv[2],
    reblog_info: true
  } : {
    limit: pageSize,
    offset: page * pageSize,
    reblog_info: true
  };
  
  if (process.argv.length > 2) {
    log.trace(`Fetching post ${process.argv[2]}`);
  } else {
    log.trace(`Fetching page ${page}`);
  }
  
  return fetch(blogName, "posts", opts)
    .then((json) => json.response.posts)
    .map((post) => {
      return format(post);
    })
    // .tap((x) => console.log(JSON.stringify(x, null, 2)))
    .tap(() => (process.argv.length > 2) ? log.fatal("Stop here") : null)
  ;
};

module.exports.pageSize = pageSize;