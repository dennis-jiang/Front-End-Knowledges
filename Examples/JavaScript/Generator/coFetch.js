const fetch = require('node-fetch');
const co = require('co');
co(function* () {
  // 直接用fetch，简单多了，fetch返回的就是Promise
  const r1 = yield fetch('https://www.baidu.com');
  const r2 = yield fetch('https://www.baidu.com');
  const r3 = yield fetch('https://www.baidu.com');
  
  return {
    r1,
    r2,
    r3,
  }
}).then((res) => {
  console.log(res);
});