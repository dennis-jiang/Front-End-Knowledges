module.exports = compose;

function compose(middleware) {
  // 参数检查，middleware必须是一个数组
  if (!Array.isArray(middleware))
    throw new TypeError("Middleware stack must be an array!");
  // 数组里面的每一项都必须是一个方法
  for (const fn of middleware) {
    if (typeof fn !== "function")
      throw new TypeError("Middleware must be composed of functions!");
  }

  // 返回一个方法，这个方法就是compose的结果
  // 外部可以通过调用这个方法来开起中间件数组的遍历
  // 参数形式和普通中间件一样，都是context和next
  return function (context, next) {
    return dispatch(0); // 开始中间件执行，从数组第一个开始

    // 执行中间件的方法
    function dispatch(i) {
      let fn = middleware[i]; // 取出需要执行的中间件

      // 如果i等于数组长度，说明数组已经执行完了
      if (i === middleware.length) {
        fn = next; // 这里让fn等于外部传进来的next，其实是进行收尾工作，比如返回404
      }

      // 如果外部没有传收尾的next，直接就resolve
      if (!fn) {
        return Promise.resolve();
      }

      // 执行中间件，注意传给中间件接收的参数应该是context和next
      // 传给中间件的next是dispatch.bind(null, i + 1)
      // 所以中间件里面调用next的时候其实调用的是dispatch(i + 1)，也就是执行下一个中间件
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
