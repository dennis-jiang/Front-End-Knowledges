// const { Layer } = require("@koa/router");
const compose = require("koa-compose");
const Layer = require("./Layer");

module.exports = Router;

function Router() {
  // 支持无new直接调用
  if (!(this instanceof Router)) return new Router();

  this.stack = []; // 变量名字都跟Express.js的路由模块一样
}

// HTTP动词函数
const methods = ["get", "post"];
for (let i = 0; i < methods.length; i++) {
  const method = methods[i];

  Router.prototype[method] = function (path, middleware) {
    // 将middleware转化为一个数组
    middleware = Array.prototype.slice.call(arguments, 1);

    this.register(path, [method], middleware);

    return this;
  };
}

Router.prototype.register = function (path, methods, middleware) {
  const stack = this.stack;

  const route = new Layer(path, methods, middleware);

  stack.push(route);

  return route;
};

Router.prototype.routes = function () {
  const router = this;

  // 这个dispatch就是我们要返回给Koa调用的中间件
  let dispatch = function dispatch(ctx, next) {
    const path = ctx.path;
    const matched = router.match(path, ctx.method); // 获取所有匹配的layer

    let layerChain; // 定义一个变量来串联所有匹配的layer

    ctx.router = router; // 顺手把router挂到ctx上，给其他Koa中间件使用

    if (!matched.route) return next(); // 如果一个layer都没匹配上，直接返回，并执行下一个Koa中间件

    const matchedLayers = matched.pathAndMethod; // 获取所有path和method都匹配的layer
    // 下面这段代码的作用是将所有layer上的stack，也就是layer的回调函数都合并到一个数组layerChain里面去
    layerChain = matchedLayers.reduce(function (memo, layer) {
      return memo.concat(layer.stack);
    }, []);

    // 这里的compose也是koa-compose这个库，源码在讲Koa源码的时候讲过
    // 使用compose将layerChain数组合并成一个可执行的方法，并拿来执行，传入参数是Koa中间件参数ctx, next
    return compose(layerChain)(ctx, next);
  };

  // 将中间件返回
  return dispatch;
};

Router.prototype.match = function (path, method) {
  const layers = this.stack; // 取出所有layer

  let layer;
  // 构建一个结构来保存匹配结果，最后返回的也是这个matched
  const matched = {
    path: [], // path保存仅仅path匹配的layer
    pathAndMethod: [], // pathAndMethod保存path和method都匹配的layer
    route: false, // 只要有一个path和method都匹配的layer，就说明这个路由是匹配上的，这个变量置为true
  };

  // 循环layers来进行匹配
  for (let i = 0; i < layers.length; i++) {
    layer = layers[i];
    // 匹配的时候调用的是layer的实例方法match
    if (layer.match(path)) {
      matched.path.push(layer); // 只要path匹配就先放到matched.path上去

      // 如果method也有匹配的，将layer放到pathAndMethod里面去
      if (~layer.methods.indexOf(method)) {
        matched.pathAndMethod.push(layer);
        if (layer.methods.length) matched.route = true;
      }
    }
  }

  return matched;
};
