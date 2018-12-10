"use strict";

const Promise = require("bluebird");

module.exports = {
  promiseDoWhile: function(action, predicate) {
    function loop() {
      if (predicate()) {
        return Promise.resolve(action()).then(loop);
      }
    }
    return Promise.resolve(action()).then(loop);
  },
  
  promiseWhile: function(predicate, action) {
    function loop() {
      if (predicate()) {
        return Promise.resolve(action()).then(loop);
      }
    }
    return Promise.resolve().then(loop);
  },
};