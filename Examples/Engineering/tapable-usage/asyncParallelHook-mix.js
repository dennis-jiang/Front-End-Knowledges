const { AsyncParallelHook } = require("tapable");

const accelerate = new AsyncParallelHook(["newSpeed"]);

console.time("total time"); // 记录起始时间

// 来一个promise写法
accelerate.tapPromise("LoggerPlugin", (newSpeed) => {
  return new Promise((resolve) => {
    // 1秒后加速才完成
    setTimeout(() => {
      console.log("LoggerPlugin", `加速到${newSpeed}`);

      resolve();
    }, 1000);
  });
});

// 再来一个async写法
accelerate.tapAsync("OverspeedPlugin", (newSpeed, done) => {
  // 2秒后检测是否超速
  setTimeout(() => {
    if (newSpeed > 120) {
      console.log("OverspeedPlugin", "您已超速！！");
    }
    done();
  }, 2000);
});

// 使用promise触发事件
// accelerate.promise(500).then(() => {
//   console.log("任务全部完成");
//   console.timeEnd("total time"); // 记录总共耗时
// });

// 使用callAsync触发事件
accelerate.callAsync(500, () => {
  console.log("任务全部完成");
  console.timeEnd("total time"); // 记录总共耗时
});
