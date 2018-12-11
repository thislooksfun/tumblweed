"use strict";

let busy = false;

module.exports = {
  get idle() { return !busy; },
  set idle(i) { busy = !i; },
  
  get busy() { return busy; },
  set busy(b) { busy = !!b; },
};