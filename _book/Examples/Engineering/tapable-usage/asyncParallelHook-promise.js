const { AsyncParallelHook } = require("tapable");

const accelerate = new AsyncParallelHook(["newSpeed"]);

console.time("total time"); // 记录起始时间

// 注意注册异步事件需要使用tapPromise
// 回调函数要返回一个promise
accelerate.tapPromise("LoggerPlugin", (newSpeed) => {
  return new Promise((resolve) => {
    // 1秒后加速才完成
    setTimeout(() => {
      console.log("LoggerPlugin", `加速到${newSpeed}`);

      resolve();
    }, 1000);
  });
});

accelerate.tapPromise("OverspeedPlugin", (newSpeed) => {
  return new Promise((resolve) => {
    // 2秒后检测是否超速
    setTimeout(() => {
      if (newSpeed > 120) {
        console.log("OverspeedPlugin", "您已超速！！");
      }
      resolve();
    }, 2000);
  });
});

accelerate.tapPromise("DamagePlugin", (newSpeed) => {
  return new Promise((resolve) => {
    // 2秒后检测是否损坏
    setTimeout(() => {
      if (newSpeed > 300) {
        console.log("DamagePlugin", "速度实在太快，车子快散架了。。。");
      }

      resolve();
    }, 2000);
  });
});

// 触发事件使用promise，直接用then处理最后的结果
accelerate.promise(500).then(() => {
  console.log("任务全部完成");
  console.timeEnd("total time"); // 记录总共耗时
});
