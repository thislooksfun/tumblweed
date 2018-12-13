$(() => {
  "use strict";
  
  // Hide overlay to start
  const $overlay = $(".overlay");
  $overlay.hide();
  
  // Templates
  function template(name) {
    return $(`#template-${name}`).html();
  }
  const templates = {
    blog: template("blog"),
    control: {
      ready:    template("controls-status-ready"   ),
      queued:   template("controls-status-queued"  ),
      starting: template("controls-status-starting"),
      running:  template("controls-status-running" ),
      pausing:  template("controls-status-pausing" ),
      paused:   template("controls-status-paused"  ),
      stopping: template("controls-status-stopping"),
    },
    popup: {
      text: template("popup-text"),
    },
  };
  
  const $blogList = $("#blogs");
  
  function updateState(controller) {
    const $ctrls = $(templates.control[controller.state]);
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
  
  function popup(type) {
    return new Promise((resolve, reject) => {
      const $popup = $(templates.popup[type]);
      const $ctrls = $(".controls", $popup);
      console.log($ctrls);
      function save() {
        $overlay.hide();
        switch (type) {
          case "text":
            resolve($popup.find("input").val());
            break;
          default:
            resolve();
        }
      }
      $popup.find("input").keypress((e) => {
        if (e.which == 13 ) {
          save();
        }
      });
      $ctrls.find("button.ok").click(save);
      $ctrls.find("button.cancel").click(() => {
        $overlay.hide();
        reject("cancelled");
      });
      $overlay
        .empty()
        .append($popup)
        .show();
      
      if (type === "text") {
        $popup.find("input").focus();
      }
    });
  }
  
  $("#add-blog").click(() => {
    
    popup("text")
      .then((name) => {
        // TODO:
        alert(name);
        
        const $blog = $(templates.blog);
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
  });
});