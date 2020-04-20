const request = require("request");

function* requestGen() {
  function sendRequest(url) {
    request(url, function (error, response) {
      if (!error && response.statusCode == 200) {
        console.log(response.body);

        itor.next(response.body);
      }
    })
  }

  const url = 'https://www.baidu.com';

  yield sendRequest(url);
  yield sendRequest(url);
  yield sendRequest(url);
}

const itor = requestGen();

itor.next();