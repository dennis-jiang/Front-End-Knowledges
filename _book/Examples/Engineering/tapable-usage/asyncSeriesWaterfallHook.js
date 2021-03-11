const { AsyncSeriesWaterfallHook } = require("tapable");

const accelerate = new AsyncSeriesWaterfallHook(["newSpeed"]);

console.time("total time"); // 记录起始时间

accelerate.tapAsync("LoggerPlugin", (newSpeed, done) => {
  // 1秒后加速才完成
  setTimeout(() => {
    console.log("LoggerPlugin", `加速到${newSpeed}`);

    // 注意done的第一个参数会被当做error
    // 第二个参数才是传递给后面任务的参数
    done(null, "LoggerPlugin");
  }, 1000);
});

accelerate.tapAsync("Plugin2", (data, done) => {
  setTimeout(() => {
    console.log(`上一个插件是: ${data}`);

    done(null, "Plugin2");
  }, 2000);
});

accelerate.tapAsync("Plugin3", (data, done) => {
  setTimeout(() => {
    console.log(`上一个插件是: ${data}`);

    done(null, "Plugin3");
  }, 2000);
});

accelerate.callAsync(500, (error, data) => {
  console.log("最后一个插件是:", data);
  console.timeEnd("total time"); // 记录总共耗时
});
