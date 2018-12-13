$(() => {
  "use strict";
  
  const ipc = require("electron").ipcRenderer;
  
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
      ready:    template("controls-state-ready"   ),
      queued:   template("controls-state-queued"  ),
      starting: template("controls-state-starting"),
      running:  template("controls-state-running" ),
      pausing:  template("controls-state-pausing" ),
      paused:   template("controls-state-paused"  ),
      stopping: template("controls-state-stopping"),
    },
    popup: {
      text: template("popup-text"),
    },
  };
  
  const $blogList = $("#blogs");
  
  ipc.on("add-blog-success", (e, name, state) => {
    setState($blogList.find(`#blog-${name}`), state);
  });
  
  ipc.on("update-blog-list", (e, blogs) => {
    $blogList.empty();
    for (const {name, state} of blogs) {
      const $blog = $(templates.blog);
      $blog.find(".name").text(name);
      setState($blog, state);
      $blogList.append($blog);
    }
  });
  
  ipc.on("state-change", (e, name, state) => {
    setState($blogList.find(`#blog-${name}`), state);
  });
  
  function setState($blog, state) {
    const $ctrls = $(templates.control[state]);
    // Attach handlers (not all will be used for each state)
    $ctrls.filter("button.download").click(() => ipc.send("buttonPress", name, "download"));
    $ctrls.filter("button.pause"   ).click(() => ipc.send("buttonPress", name, "pause"));
    $ctrls.filter("button.resume"  ).click(() => ipc.send("buttonPress", name, "resume"));
    $ctrls.filter("button.cancel"  ).click(() => ipc.send("buttonPress", name, "cancel"));
    // Insert controls
    $(".controls", $blog).empty().append($ctrls);
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
        ipc.send("add-blog", name);
      });
  });
});