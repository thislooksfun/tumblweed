// const DownloadManager = pquire("util/download-manager");

$(() => {
  "use strict";
  
  // Templates
  const blogTemplate = $("#template-blog").html();
  const controlTemplates = {
    ready:    $("#template-controls-status-ready"   ).html(),
    queued:   $("#template-controls-status-queued"  ).html(),
    starting: $("#template-controls-status-starting").html(),
    running:  $("#template-controls-status-running" ).html(),
    pausing:  $("#template-controls-status-pausing" ).html(),
    paused:   $("#template-controls-status-paused"  ).html(),
    stopping: $("#template-controls-status-stopping").html(),
  };
  
  const $blogList = $("#blogs");
  
  function updateState(controller) {
    const $ctrls = $(controlTemplates[controller.state]);
    // Attach handlers (not all will be used for each state)
    $ctrls.filter("button.download").click(() => controller.download());
    $ctrls.filter("button.pause"   ).click(() => controller.pause());
    $ctrls.filter("button.resume"  ).click(() => controller.resume());
    $ctrls.filter("button.cancel"  ).click(() => controller.cancel());
    // Insert controls
    $(".controls", controller.$blog)
      .empty()
      .append($ctrls);
  }
  
  $("#add-blog").click(() => {
    const $blog = $(blogTemplate);
    const controller = {
      $blog: $blog,
      _state: "ready",
      get state() { return this._state; },
      set state(s) {
        console.log("Set state to " + s);
        this._state = s;
        updateState(this);
      },
      download: function() {
        console.log("DL");
        const _self = this;
        _self.state = "starting";
        setTimeout(() => _self.state = "running", 1 * 1000);
      },
      pause: function() {
        console.log("Pause");
        const _self = this;
        _self.state = "pausing";
        setTimeout(() => _self.state = "paused", 1 * 1000);
      },
      resume: function() {
        console.log("Resume");
        const _self = this;
        _self.state = "starting";
        setTimeout(() => _self.state = "running", 1 * 1000);
      },
      cancel: function() {
        console.log("Cancel");
        const _self = this;
        _self.state = "stopping";
        setTimeout(() => _self.state = "ready", 1 * 1000);
      },
    };
    updateState(controller);
    $blogList.append($blog);
  });

  // function startDownload() {
  //   console.log("Starting download");
  // }

  // (async function() {
  //   const dlmg = new DownloadManager();
  //   // TODO: add progress indicators to UI
  //   await dlmg.crawl("https://<blog>.tumblr.com/");
  // })();
});