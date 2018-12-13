"use strict";

let busy = false;

let events;
function onChange() {
  events = events || pquire("events");
  events.send("status-changed", busy);
}

module.exports = {
  get idle() { return !busy; },
  set idle(i) { busy = !i; onChange(); },
  
  get busy() { return busy; },
  set busy(b) { busy = !!b; onChange(); },
};