"use strict";

module.exports = {
  join: function(a, b, overwrite = true) {
    if (typeof a !== "object" || typeof b !== "object") {
      throw new Error("Both parameters must be objects");
    }
    
    for (const key in b) {
      if (overwrite || !a.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
    
    return a;
  },
  
  pluralize: function(count, word, suffix = "s") {
    return count + " " + word + (count === 1 ? "" : suffix);
  },
  
  highestRes: function(obj, prefix) {
    const keys = Object.keys(obj);
    const urls = keys.filter((k) => k.startsWith(prefix));
    const resolutions = urls.map((u) => parseInt(u.slice(prefix.length))).sort((a,b) => b - a);
    return obj[`${prefix}${resolutions[0]}`];
  }
};