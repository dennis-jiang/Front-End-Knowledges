var pathRegexp = require("path-to-regexp");

module.exports = Layer;

function Layer(path, fn) {
  this.path = path;

  this.handle = fn;
  this.method = "";

  // 添加一个匹配正则
  this.regexp = pathRegexp(path);
  // 快速匹配/
  this.regexp.fast_slash = path === "/";
}

Layer.prototype.match = function match(path) {
  var match;

  if (path != null) {
    if (this.regexp.fast_slash) {
      return true;
    }

    match = this.regexp.exec(path);
  }

  // 没匹配上，返回false
  if (!match) {
    return false;
  }

  // 不然返回true
  return true;
};

Layer.prototype.handle_request = function handle(req, res, next) {
  var fn = this.handle;

  fn(req, res, next);
};
