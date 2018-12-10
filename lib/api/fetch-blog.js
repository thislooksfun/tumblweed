"use strict";

const fetch = pquire("fetch");


module.exports = function(blogName) {
  return fetch(blogName, "info")
    .then((json) => {
      return json.response.blog;
    })
    // .tap((x) => console.log(JSON.stringify(x, null, 2)))
  ;
};