var Router = require("./router");

var http = require("http");
var finalhandler = require("finalhandler");

var app = (exports = module.exports = {});

app.listen = function listen() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
};

app.handle = function handle(req, res) {
  var router = this._router;

  // 最终的处理方法
  var done = finalhandler(req, res);

  // 如果没有定义router
  // 直接结束返回
  if (!router) {
    done();
    return;
  }

  // 有router，就用router来处理
  router.handle(req, res, done);
};

app.lazyrouter = function lazyrouter() {
  if (!this._router) {
    this._router = new Router();
  }
};

// app.use就是调用router.use
app.use = function use(fn) {
  var path = "/";

  this.lazyrouter();
  var router = this._router;
  router.use(path, fn);
};

// HTTP动词的方法
var methods = ["get", "post"];
methods.forEach(function (method) {
  app[method] = function (path) {
    this.lazyrouter();

    var route = this._router.route(path);
    route[method].apply(route, Array.prototype.slice.call(arguments, 1));
    return this;
  };
});
