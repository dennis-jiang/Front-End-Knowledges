// const { SyncBailHook } = require("tapable"); 
const { SyncBailHook } = require("./SyncBailHook"); 

const accelerate = new SyncBailHook(["newSpeed"]);

accelerate.tap("LoggerPlugin", (newSpeed) =>
  console.log("LoggerPlugin", `加速到${newSpeed}`)
);

// 再注册一个回调，用来检测是否超速
// 如果超速就返回一个错误
accelerate.tap("OverspeedPlugin", (newSpeed) => {
  if (newSpeed > 120) {
    console.log("OverspeedPlugin", "您已超速！！");

    return new Error('您已超速！！');
  }
});

// 由于上一个回调返回了一个不为undefined的值
// 这个回调不会再运行了
accelerate.tap("DamagePlugin", (newSpeed) => {
  if (newSpeed > 300) {
    console.log("DamagePlugin", "速度实在太快，车子快散架了。。。");
  }
});

accelerate.call(500);