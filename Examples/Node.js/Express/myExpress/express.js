var mixin = require("merge-descriptors");
var proto = require("./application");

// 创建web服务器的方法
function createApplication() {
  // app方法其实就是传给http.createServer的回调函数
  var app = function (req, res) {
    app.handle(req, res); // 这是真正的服务器处理入口
  };

  mixin(app, proto, false);

  return app;
}

exports = module.exports = createApplication;

exports.static = require("serve-static");
