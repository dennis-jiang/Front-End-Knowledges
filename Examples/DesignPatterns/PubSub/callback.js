const request = require("request");

request('https://www.baidu.com', function (error, response) {
  if (!error && response.statusCode == 200) {
    console.log('get times 1');

    request('https://www.baidu.com', function(error, response) {
      if (!error && response.statusCode == 200) {
        console.log('get times 2');

        request('https://www.baidu.com', function(error, response) {
          if (!error && response.statusCode == 200) {
            console.log('get times 3');
          }
        })
      }
    })
  }
});