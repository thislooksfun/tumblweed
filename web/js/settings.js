$(() => {
  "use strict";
  
  const remote = require("electron").remote;
  const rreq = remote.require;
  const settings = rreq("./lib/settings");
  
  $("#close-btn").click(() => {
    remote.getCurrentWindow().destroy();
  });
  
  // Templates
  function template(name) {
    return $(`#template-${name}`).html();
  }
  const templates = {
    string: template("setting-string"),
    bool:   template("setting-bool"  ),
    number: template("setting-number"),
  };
  
  
  const $settings = $("#settings");
  
  const list = settings.list();
  console.log(list);
  
  function addSetting({human_name, machine_name, type, value}) {
    const $setting = $(templates[type]);
    $setting.find(".name").text(human_name);
    
    const $input = $setting.find("input");
    
    switch (type) {
      case "string":
      case "number": $input.val(value); break;
      case "bool":   $input.prop("checked", value); break;
    }
    
    $input.change(function() {
      console.log("Changed!");
      switch (type) {
        case "string":
        case "number": settings.set(machine_name, $(this).val()); break;
        case "bool":   settings.set(machine_name, this.checked); break;
      }
    });
    
    $settings.append($setting);
  }
  
  // TODO: Populate page with settings
  for (const opt of settings.list()) {
    addSetting(opt);
  }
});