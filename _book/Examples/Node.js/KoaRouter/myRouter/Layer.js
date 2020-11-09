const { pathToRegexp } = require("path-to-regexp");

module.exports = Layer;

function Layer(path, methods, middleware) {
  // 初始化methods和stack属性
  this.methods = [];
  // 注意这里的stack存放的是我们传入的回调函数
  this.stack = Array.isArray(middleware) ? middleware : [middleware];

  // 将参数methods一个一个塞进this.methods里面去
  for (let i = 0; i < methods.length; i++) {
    this.methods.push(methods[i].toUpperCase()); // ctx.method是大写，注意这里转换为大写
  }

  // 保存path属性
  this.path = path;
  // 使用path-to-regexp库将path转化为正则
  this.regexp = pathToRegexp(path);
}

Layer.prototype.match = function (path) {
  return this.regexp.test(path);
};
