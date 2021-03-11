const { SyncLoopHook } = require("tapable");

const accelerate = new SyncLoopHook(["newSpeed"]);

accelerate.tap("LoopPlugin", (newSpeed) => {
  console.log("LoopPlugin", `循环加速到${newSpeed}`);

  return new Date().getTime() % 5 !== 0 ? true : undefined;
});

accelerate.tap("LastPlugin", (newSpeed) => {
  console.log("循环加速总算结束了");
});

accelerate.call(100);
