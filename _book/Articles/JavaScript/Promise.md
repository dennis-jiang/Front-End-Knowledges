前段时间我用两篇文章深入讲解了异步的概念和Event Loop的底层原理，然后还讲了一种自己实现异步的发布订阅模式：

[setTimeout和setImmediate到底谁先执行，本文让你彻底理解Event Loop](https://juejin.im/post/5e782486518825490455fb17)

[从发布订阅模式入手读懂Node.js的EventEmitter源码](https://juejin.im/post/5e7978485188255e237c2a29)

本文会讲解另一种更现代的异步实现方案：`Promise`。Promise几乎是面试必考点，所以我们不能仅仅会用，还得知道他的底层原理，学习他原理的最好方法就是自己也实现一个Promise。所以本文会自己实现一个遵循`Promise/A+`规范的Promise。另外`async`和`Generator`跟`Promise`也是相关的，所以我们也会动手自己实现一下。实现之后，我们还要用`Promise/A+`官方的测试工具来测试下我们的实现是否正确，下面是他们的链接：

`Promise/A+`规范: [https://github.com/promises-aplus/promises-spec](https://github.com/promises-aplus/promises-spec)

`Promise/A+`测试工具: [https://github.com/promises-aplus/promises-tests](https://github.com/promises-aplus/promises-tests)

## Promise用法

Promise的基本用法，网上有很多，我这里简单提一下，我还是用三个相互依赖的网络请求做例子，假如我们有三个网络请求，请求2必须依赖请求1的结果，请求3必须依赖请求2的结果，如果用回调的话会有三层，会陷入“回调地狱”，用Promise就清晰多了:

```javascript
const request = require("request");

// 我们先用Promise包装下三个网络请求
// 请求成功时resolve这个Promise
const request1 = function() {
  const promise = new Promise((resolve) => {
    request('https://www.baidu.com', function (error, response) {
      if (!error && response.statusCode == 200) {
        resolve('request1 success');
      }
    });
  });

  return promise;
}

const request2 = function() {
  const promise = new Promise((resolve) => {
    request('https://www.baidu.com', function (error, response) {
      if (!error && response.statusCode == 200) {
        resolve('request2 success');
      }
    });
  });

  return promise;
}

const request3 = function() {
  const promise = new Promise((resolve) => {
    request('https://www.baidu.com', function (error, response) {
      if (!error && response.statusCode == 200) {
        resolve('request3 success');
      }
    });
  });

  return promise;
}


// 先发起request1，等他resolve后再发起request2，
// 然后是request3
request1().then((data) => {
  console.log(data);
  return request2();
})
.then((data) => {
  console.log(data);
  return request3();
})
.then((data) => {
  console.log(data);
})
```

上面的例子里面，`then`是可以链式调用的，后面的`then`可以拿到前面`resolve`出来的数据，我们控制台可以看到三个success依次打出来:

![image-20200324164123892](../../images/JavaScript/Promise/image-20200324164123892.png)

## Promises/A+规范

通过上面的例子，其实我们已经知道了一个Promise长什么样子，Promises/A+规范其实就是对这个长相进一步进行了规范。下面我会对这个规范进行一些讲解。

### 术语

> 1. “promise”：是一个拥有 `then` 方法的对象或函数，其行为符合本规范
>
> 2. “thenable”：是一个定义了 `then` 方法的对象或函数。这个主要是用来兼容一些老的Promise实现，只要一个Promise实现是thenable，也就是拥有`then`方法的，就可以跟Promises/A+兼容。
> 3. 