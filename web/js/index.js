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
    const $blog = $(templates.blog);
    $blog.attr("id", `blog-${name}`);
    $blog.find(".name").text(`https://${name}.tumblr.com`);
    setState($blog, name, state);
    $blogList.append($blog);
  });
  
  ipc.on("add-blog-failure", (e, reason) => {
    alert(reason);
  });
  
  ipc.on("update-blog-list", (e, blogs) => {
    $blogList.empty();
    for (const {name, state} of blogs) {
      const $blog = $(templates.blog);
      $blog.find(".name").text(name);
      setState($blog, name, state);
      $blogList.append($blog);
    }
  });
  
  ipc.on("update-blog", (e, name, state, progress) => {
    const $blog = $blogList.find(`#blog-${name}`);
    if ($blog == null) {
      throw new Error(`Missing blog ${name} -- This shouldn't happen; if you see this, submit an issue on GitHub.`);
    }
    setState($blog, name, state);
    $blog.find(".status").text(`${progress.done}/${progress.total} posts downloaded (${(100 * progress.done / progress.total).toFixed(2)}%)`);
  });
  
  ipc.on("status-changed", (e, busy) => {
    $("#settings-btn")
      .prop("disabled", busy)
      .prop("title", busy ? "Settings cannot be changed while running" : null);
  });
  
  const $updateBtn = $("#update-btn");
  $updateBtn.hide();
  $updateBtn.click(() => ipc.send("quitAndInstall"));
  ipc.on("updateReady", () => $updateBtn.show());
  
  function setState($blog, name, state) {
    const $ctrls = $(templates.control[state]);
    // Attach handlers (not all will be used for each state)
    $ctrls.filter("button.download").click(() => ipc.send("button-pressed", name, "download"));
    $ctrls.filter("button.pause"   ).click(() => ipc.send("button-pressed", name, "pause"));
    $ctrls.filter("button.resume"  ).click(() => ipc.send("button-pressed", name, "resume"));
    $ctrls.filter("button.cancel"  ).click(() => ipc.send("button-pressed", name, "cancel"));
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
  
  $("#settings-btn").click(() => {
    ipc.send("open-settings");
  });
});