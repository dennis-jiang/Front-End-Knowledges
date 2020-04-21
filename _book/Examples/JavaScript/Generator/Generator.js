const request = require("request");

function* requestGen() {
  function sendRequest(url) {
    request(url, function (error, response) {
      if (!error && response.statusCode == 200) {
        console.log(response.body);

        // 注意这里，引用了外部的迭代器itor
        itor.next(response.body);
      }
    })
  }

  const url = 'https://www.baidu.com';

  // 使用yield发起三个请求，每个请求成功后再继续调next
  const r1 = yield sendRequest(url);
  console.log('r1', r1);
  const r2 = yield sendRequest(url);
  console.log('r2', r2);
  const r3 = yield sendRequest(url);
  console.log('r3', r3);
}

const itor = requestGen();

// 手动调第一个next
itor.next();