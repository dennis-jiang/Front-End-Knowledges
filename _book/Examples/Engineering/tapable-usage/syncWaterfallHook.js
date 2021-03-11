const { SyncWaterfallHook } = require("tapable");

const accelerate = new SyncWaterfallHook(["newSpeed"]);

accelerate.tap("LoggerPlugin", (newSpeed) => {
  console.log("LoggerPlugin", `加速到${newSpeed}`);

  return "LoggerPlugin";
});

accelerate.tap("Plugin2", (data) => {
  console.log(`上一个插件是: ${data}`);

  return "Plugin2";
});

accelerate.tap("Plugin3", (data) => {
  console.log(`上一个插件是: ${data}`);

  return "Plugin3";
});

const lastPlugin = accelerate.call(100);

console.log(`最后一个插件是：${lastPlugin}`);
