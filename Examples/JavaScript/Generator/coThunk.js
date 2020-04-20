// 还是之前的thunk函数
function Thunk(fn) {
  return function(...args) {
    return function(callback) {
      return fn.call(this, ...args, callback)
    }
  }
}

// 将我们需要的request转换成thunk
const request = require('request');
const requestThunk = Thunk(request);

// 转换后的requestThunk其实可以直接用了
// 用法就是 requestThunk(url)(callback)
// 但是我们co接收的thunk是 fn(callback)形式
// 我们转换一下
// 这时候的baiduRequest也是一个函数，url已经传好了，他只需要一个回调函数做参数就行
// 使用就是这样：baiduRequest(callback)
const baiduRequest = requestThunk('https://www.baidu.com');

// 引入co执行, co的参数是一个Generator
// co的返回值是一个Promise，我们可以用then拿到他的结果
const co = require('co');
co(function* () {
  const r1 = yield baiduRequest;
  const r2 = yield baiduRequest;
  const r3 = yield baiduRequest;
  
  return {
    r1,
    r2,
    r3,
  }
}).then((res) => {
  console.log(res);
});