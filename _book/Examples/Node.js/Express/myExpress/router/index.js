var Route = require("./route");
var setPrototypeOf = require("setprototypeof");
var parseUrl = require("parseurl");
var Layer = require("./layer");

var proto = function () {
  function router(req, res) {
    router.handle(req, res);
  }

  setPrototypeOf(router, proto);

  // stack是用来存储layer的
  router.stack = [];

  return router;
};

module.exports = proto;

proto.route = function route(path) {
  var route = new Route();
  var layer = new Layer(path, route.dispatch.bind(route));

  layer.route = route;

  this.stack.push(layer);

  return route;
};

// 真正处理路由的函数
proto.handle = function handle(req, res, done) {
  var self = this;
  var idx = 0;
  var stack = self.stack;

  // next方法来查找对应的layer和回调函数
  next();
  function next() {
    // 使用第三方库parseUrl获取path，如果没有path，直接返回
    var path = parseUrl(req).pathname;
    if (path == null) {
      return done();
    }

    var layer;
    var match;
    var route;

    while (match !== true && idx < stack.length) {
      layer = stack[idx++]; // 注意这里先执行 layer = stack[idx]; 再执行idx++;
      match = layer.match(path); // 调用layer.match来检测当前路径是否匹配
      route = layer.route;

      // 没匹配上，跳出当次循环
      if (match !== true) {
        continue;
      }

      // layer匹配上了，但是没有route，也跳出当次循环
      if (!route) {
        continue;
      }

      // 看看route上有没有对应的method
      var method = req.method;
      var has_method = route._handles_method(method);
      // 如果没有对应额method，其实也是没匹配上，跳出当次循环
      if (!has_method) {
        match = false;
        continue;
      }
    }

    // 循环完了还没有匹配的，就done了，其实就是404
    if (match !== true) {
      return done();
    }

    // 如果匹配上了，就执行对应的回调函数
    return layer.handle_request(req, res, next);
  }
};

proto.use = function use(path, fn) {
  var layer = new Layer(path, fn);

  this.stack.push(layer);
};
