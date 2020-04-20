function Thunk(fn) {
  return function(...args) {
    return function(callback) {
      return fn.call(this, ...args, callback)
    }
  }
}

function run(fn) {
  let gen = fn();
  
  function next(err, data) {
    let result = gen.next(data);
    
    if(result.done) return;
    
    result.value(next);
  }
  
  next();
}

// 使用thunk方法
const request = require("request");
const requestThunk = Thunk(request);

function* requestGen() {
  const url = 'https://www.baidu.com';
  
  let r1 = yield requestThunk(url);
  console.log(r1.body);
  
  let r2 = yield requestThunk(url);
  console.log(r2.body);
  
  let r3 = yield requestThunk(url);
  console.log(r3.body);
}

// 启动运行
run(requestGen);