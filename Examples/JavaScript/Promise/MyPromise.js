// 先定义三个常量表示状态
var PENDING = 'pending';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';

function MyPromise(fn) {
  this.status = PENDING;    // 初始状态为pending
  this.value = null;        // 初始化value
  this.reason = null;       // 初始化reason

  // 构造函数里面添加两个数组存储成功和失败的回调
  this.onFulfilledCallbacks = [];
  this.onRejectedCallbacks = [];

  // 存一下this,以便resolve和reject里面访问
  var that = this;
  // resolve方法参数是value
  function resolve(value) {
    if(that.status === PENDING) {
      that.status = FULFILLED;
      that.value = value;

      // resolve里面将所有成功的回调拿出来执行
      that.onFulfilledCallbacks.forEach(callback => {
        callback(that.value);
      });
    }
  }
  
  // reject方法参数是reason
  function reject(reason) {
    if(that.status === PENDING) {
      that.status = REJECTED;
      that.reason = reason;

      // resolve里面将所有失败的回调拿出来执行
      that.onRejectedCallbacks.forEach(callback => {
        callback(that.reason);
      });
    }
  }

  try {
    fn(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

function resolvePromise(promise, x, solve, reject) {

}

MyPromise.prototype.then = function(onFulfilled, onRejected) {
  // 如果onFulfilled不是函数，给一个默认函数，返回value
  var realOnFulfilled = onFulfilled;
  if(typeof realOnFulfilled !== 'function') {
    realOnFulfilled = function (value) {
      return value;
    }
  }

  // 如果onRejected不是函数，给一个默认函数，返回reason的Error
  var realOnRejected = onRejected;
  if(typeof realOnRejected !== 'function') {
    realOnRejected = function (reason) {
      if(reason instanceof Error) {
        throw reason;
      } else {
        throw new Error(reason)
      }
    }
  }

  var that = this;   // 保存一下this

  if(this.status === FULFILLED) {
    var promise2 = new MyPromise(function(resolve, reject) {
      try {
        if (typeof onFulfilled !== 'function') {
          resolve(that.value);
        } else {
          var x = realOnFulfilled(that.value);
          resolvePromise(promise2, x, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  
    return promise2;
  }

  if(this.status === REJECTED) {
    var promise2 = new MyPromise(function(resolve, reject) {
      try {
        if(typeof onRejected !== 'function') {
          reject(that.reason);
        } else {
          realOnRejected(that.reason);
          resolvePromise(promise2, x, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  
    return promise2;
  }

  // 如果还是PENDING状态，将回调保存下来
  if(this.status === PENDING) {
    var promise2 = new MyPromise(function(resolve, reject) {
      that.onFulfilledCallbacks.push(function() {
        try {
          if(typeof onFulfilled !== 'function') {
            resolve(that.value);
          } else {
            realOnFulfilled(that.value);
            resolvePromise(promise2, x, resolve, reject);
          }
        } catch (error) {
          reject(error);
        }
      });
      that.onRejectedCallbacks.push(function() {
        try {
          if(typeof onRejected !== 'function') {
            reject(that.reason);
          } else {
            realOnRejected(that.reason);
            resolvePromise(promise2, x, resolve, reject);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  
    return promise2;
  }
}

module.exports = MyPromise;