var { flatten } = require("array-flatten");
var Layer = require("./layer");

var slice = Array.prototype.slice;

module.exports = Route;

function Route() {
  this.stack = [];
  this.methods = {}; // 一个加快查找的hash表
}

Route.prototype._handles_method = function _handles_method(method) {
  var name = method.toLowerCase();

  return Boolean(this.methods[name]);
};

Route.prototype.dispatch = function dispatch(req, res, done) {
  var idx = 0;
  var stack = this.stack; // 注意这个stack是route.stack

  // 如果stack为空，直接done
  // 这里的done其实是router.stack.layer的next
  // 也就是执行下一个router.stack.layer
  if (stack.length === 0) {
    return done();
  }

  var method = req.method.toLowerCase();

  // 这个next方法其实是在router.stack.layer.route.stack上寻找method匹配的layer
  // 找到了就执行layer的回调函数
  next();
  function next() {
    var layer = stack[idx++];
    if (!layer) {
      return done();
    }

    if (layer.method && layer.method !== method) {
      return next();
    }

    layer.handle_request(req, res, next);
  }
};

var methods = ["get", "post"];
methods.forEach(function (method) {
  Route.prototype[method] = function () {
    // 支持传入多个回调函数
    var handles = flatten(slice.call(arguments));

    // 为每个回调新建一个layer，并加到stack上
    for (var i = 0; i < handles.length; i++) {
      var handle = handles[i];

      // 每个handle都应该是个函数
      if (typeof handle !== "function") {
        var type = toString.call(handle);
        var msg =
          "Route." +
          method +
          "() requires a callback function but got a " +
          type;
        throw new Error(msg);
      }

      var layer = new Layer("/", handle);
      layer.method = method;
      this.methods[method] = true; // 将methods对应的method设置为true，用于后面的快速查找
      this.stack.push(layer);
    }
  };
});
