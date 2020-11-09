const Emitter = require("events");
const http = require("http");
const compose = require("./compose");
// const compose = require('koa-compose');
// const context = require("./context");

// module.exports 直接导出Application类
module.exports = class Application extends Emitter {
  // 构造函数先运行下父类的构造函数
  // 再进行一些初始化工作
  constructor() {
    super();

    this.context = {};

    // middleware实例属性初始化为一个空数组，用来存储后续可能的中间件
    this.middleware = [];
  }

  use(fn) {
    // 中间件必须是一个函数，不然就报错
    if (typeof fn !== "function")
      throw new TypeError("middleware must be a function!");

    // 处理逻辑很简单，将接收到的中间件塞入到middleware数组就行
    this.middleware.push(fn);
    return this;
  }

  listen(...args) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  callback() {
    // compose来自koa-compose库，就是将中间件合并成一个函数
    // 我们需要自己实现
    const fn = compose(this.middleware);

    // callback返回值必须符合http.createServer参数形式
    // 即 (req, res) => {}
    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }

  // 创建上下文ctx对象的函数
  createContext(req, res) {
    const context = Object.create(this.context);
    context.app = this;
    context.req = req;
    context.res = res;

    return context;
  }

  // 处理具体请求
  handleRequest(ctx, fnMiddleware) {
    const handleResponse = () => respond(ctx);

    // 调用中间件处理
    // 所有处理完后就调用handleResponse返回请求
    return fnMiddleware(ctx)
      .then(handleResponse)
      .catch((err) => {
        console.log("Somethis is wrong: ", err);
      });
  }
};

function respond(ctx) {
  const res = ctx.res; // 取出res对象
  const body = ctx.body; // 取出body

  return res.end(body); // 用res返回bodu
}
