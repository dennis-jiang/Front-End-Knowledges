var request = require("request");
var MyPromise = require('./MyPromise');

var promise1 = new MyPromise((resolve) => {
  request('https://www.baidu.com', function (error, response) {
    if (!error && response.statusCode == 200) {
      resolve('request1 success');
    }
  });
});

promise1.then(function(value) {
  console.log(value);
});

var promise2 = new MyPromise((resolve, reject) => {
  request('https://www.baidu.com', function (error, response) {
    if (!error && response.statusCode == 200) {
      reject('request2 failed');
    }
  });
});

promise2.then(function(value) {
  console.log(value);
}, function(reason) {
  console.log(reason);
});
