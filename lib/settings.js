"use strict";

const path = require("path");
const fs = require("fs-extra");

const settingsFilePath = path.join(__dirname, "../settings.json");
// Lazy loading
let loaded = false;

let opts = {
  download_dir: {
    name: "Destination",
    type: "string",
    default: path.join(__dirname, "../Blogs"),
  },
  api_key: {
    name: "API Key",
    type: "string",
    default: "<value>",
  },
  
  compact_json: {
    name: "Compact JSON",
    type: "bool",
    default: true,
  },
  
  overwrite: {
    name: "Overwrite existing files",
    type: "bool",
    default: false,
  },
  
  timeout: {
    name: "Timeout (in seconds)",
    type: "number",
    default: 5,
  },
  
  /*
  _template: {
    name: "Human readable name",
    type: "type"
    default: "value"
  },
  */
};

function load() {
  // Load from JSON file
  log.debug("Loading settings");
  try {
    // Use 'require' because it automatically converts to JSON
    const jsn = require(settingsFilePath);
    for (const key in jsn) {
      opts[key].value = jsn[key];
    }
  } catch (e) {
    log.warn(`An error occurred while loading settings.json: ${e.message}`);
  }
  
  // Fill in any missing values
  for (const key in opts) {
    if (opts[key].value == null) {
      opts[key].value = opts[key].default;
    }
  }
  
  log.debug("Settings loaded");
  
  // Save to disk, to fill in settings.json for next time
  save();
  
  loaded = true;
}

function save() {
  let out = {};
  for (const key in opts) {
    if (opts[key].value != null) {
      out[key] = opts[key].value;
    }
  }
  fs.writeFileSync(settingsFilePath, JSON.stringify(out, null, 2));
}

module.exports = {
  get: function(name) {
    if (!loaded) { load(); }
    const x = opts[name];
    return x == null ? undefined : x.value;
  },
  
  get_name: function(name) {
    const x = opts[name];
    return x == null ? undefined : x.name;
  },
  
  get_type: function(name) {
    const x = opts[name];
    return x == null ? undefined : x.type;
  },
  
  set: function(name, value) {
    if (!loaded) { load(); }
    let x = opts[name];
    if (x != null) {
      x.value = value;
    }
    save();
  },
  
  list: function() {
    if (!loaded) { load(); }
    
    return Object
      .keys(opts)
      .map((name) => ({
        machine_name: name,
        human_name: opts[name].name,
        type: opts[name].type,
        value: opts[name].value
      }));
  },
};