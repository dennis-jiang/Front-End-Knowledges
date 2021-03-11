const { AsyncSeriesHook } = require("tapable");

const accelerate = new AsyncSeriesHook(["newSpeed"]);

console.time("total time"); // 记录起始时间

accelerate.tapAsync("LoggerPlugin", (newSpeed, done) => {
  // 1秒后加速才完成
  setTimeout(() => {
    console.log("LoggerPlugin", `加速到${newSpeed}`);

    done();
  }, 1000);
});

accelerate.tapAsync("OverspeedPlugin", (newSpeed, done) => {
  // 2秒后检测是否超速
  setTimeout(() => {
    if (newSpeed > 120) {
      console.log("OverspeedPlugin", "您已超速！！");
    }
    done();
  }, 2000);
});

accelerate.tapAsync("DamagePlugin", (newSpeed, done) => {
  // 2秒后检测是否损坏
  setTimeout(() => {
    if (newSpeed > 300) {
      console.log("DamagePlugin", "速度实在太快，车子快散架了。。。");
    }

    done();
  }, 2000);
});

accelerate.callAsync(500, () => {
  console.log("任务全部完成");
  console.timeEnd("total time"); // 记录总共耗时
});
