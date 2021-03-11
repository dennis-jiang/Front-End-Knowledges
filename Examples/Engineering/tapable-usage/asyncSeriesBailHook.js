const { AsyncSeriesBailHook } = require("tapable");

const accelerate = new AsyncSeriesBailHook(["newSpeed"]);

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

    // 这个任务的done返回一个错误
    // 注意第一个参数是node回调约定俗成的错误
    // 第二个参数才是Bail的返回值
    done(null, new Error("您已超速！！"));
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

accelerate.callAsync(500, (error, data) => {
  if (data) {
    console.log("任务执行出错：", data);
  } else {
    console.log("任务全部完成");
  }
  console.timeEnd("total time"); // 记录总共耗时
});
