[上一篇文章我们讲了怎么用`Node.js`原生API来写一个`web服务器`](https://juejin.im/post/6887797543212843016)，虽然代码比较丑，但是基本功能还是有的。但是一般我们不会直接用原生API来写，而是借助框架来做，比如本文要讲的`Express`。通过上一篇文章的铺垫，我们可以猜测，`Express`其实也没有什么黑魔法，也仅仅是原生API的封装，主要是用来提供更好的扩展性，使用起来更方便，代码更优雅。本文照例会从`Express`的基本使用入手，然后自己手写一个`Express`来替代他，也就是源码解析。

**本文可运行代码已经上传GitHub，拿下来一边玩代码，一边看文章效果更佳：[https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/Node.js/Express](https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/Node.js/Express)**

## 简单示例

使用`Express`搭建一个最简单的`Hello World`也是几行代码就可以搞定，下面这个例子来源官方文档：

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
```

可以看到`Express`的路由可以直接用`app.get`这种方法来处理，比我们之前在`http.createServer`里面写一堆`if`优雅多了。我们用这种方式来改写下上一篇文章的代码：

```javascript
const path = require("path");
const express = require("express");
const fs = require("fs");
const url = require("url");

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.end("Hello World");
});

app.get("/api/users", (req, res) => {
  const resData = [
    {
      id: 1,
      name: "小明",
      age: 18,
    },
    {
      id: 2,
      name: "小红",
      age: 19,
    },
  ];
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(resData));
});

app.post("/api/users", (req, res) => {
  let postData = "";
  req.on("data", (chunk) => {
    postData = postData + chunk;
  });

  req.on("end", () => {
    // 数据传完后往db.txt插入内容
    fs.appendFile(path.join(__dirname, "db.txt"), postData, () => {
      res.end(postData); // 数据写完后将数据再次返回
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});

```

`Express`还支持中间件，我们写个中间件来打印出每次请求的路径：

```javascript
app.use((req, res, next) => {
  const urlObject = url.parse(req.url);
  const { pathname } = urlObject;

  console.log(`request path: ${pathname}`);

  next();
});
```

`Express`也支持静态资源托管，不过他的API是需要指定一个文件夹来单独存放静态资源的，比如我们新建一个`public`文件夹来存放静态资源，使用`express.static`中间件配置一下就行：

```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

然后就可以拿到静态资源了：

<img src="../../images/Node/Express/image-20201007171251421.png" alt="image-20201007171251421" style="zoom:50%;" />

## 手写源码

手写源码才是本文的重点，前面的不过是铺垫，本文手写的目标就是自己写一个`express`来替换前面用到的`express api`，其实就是源码解析。在开始之前，我们先来看看用到了哪些`API`：

> 1. `express()`，第一个肯定是`express`函数，这个运行后会返回一个`app`的实例，后面用的很多方法都是这个`app`上的。
> 2. `app.listen`，这个方法类似于原生的`server.listen`，用来启动服务器。
> 3. `app.get`，这是处理路由的API，类似的还有`app.post`等。
> 4. `app.use`，这是中间件的调用入口，所有中间件都要通过这个方法来调用。
> 5. `express.static`，这个中间件帮助我们做静态资源托管，其实是另外一个库了，叫[serve-static](https://github.com/expressjs/serve-static)，因为跟`Express`架构关系不大，本文就先不讲他的源码了。

[本文所有手写代码全部参照官方源码写成](https://github.com/expressjs/express/tree/master/lib)，方法名和变量名尽量与官方保持一致，大家可以对照着看，写到具体的方法时我也会贴出官方源码的地址。

### express()

首先需要写的肯定是`express()`，这个方法是一切的开始，他会创建并返回一个`app`，这个`app`就是我们的`web服务器`。

```javascript
// express.js
var mixin = require('merge-descriptors');
var proto = require('./application');

// 创建web服务器的方法
function createApplication() {
  // 这个app方法其实就是传给http.createServer的回调函数
  var app = function (req, res) {

  };

  mixin(app, proto, false);

  return app;
}

exports = module.exports = createApplication;
```

上述代码就是我们在运行`express()`的时候执行的代码，其实就是个空壳，返回的`app`暂时是个空函数，真正的`app`并没在这里，而是在`proto`上，从上述代码可以看出`proto`其实就是`application.js`，然后通过下面这行代码将`proto`上的东西都赋值给了`app`：

```javascript
mixin(app, proto, false);
```

这行代码用到了一个第三方库`merge-descriptors`，这个库总共没有几行代码，做的事情也很简单，就是将`proto`上面的属性挨个赋值给`app`，对`merge-descriptors`源码感兴趣的可以看这里：[https://github.com/component/merge-descriptors/blob/master/index.js](https://github.com/component/merge-descriptors/blob/master/index.js)。

`Express`这里之所以使用`mixin`，而不是普通的面向对象来继承，是因为它除了要`mixin proto`外，还需要`mixin`其他库，也就是需要多继承，我这里省略了，但是官方源码是有的。

`express.js`对应的源码看这里：[https://github.com/expressjs/express/blob/master/lib/express.js](https://github.com/expressjs/express/blob/master/lib/express.js)

### app.listen

上面说了，`express.js`只是一个空壳，真正的`app`在`application.js`里面，所以`app.listen`也是在这里。

```javascript
// application.js

var app = exports = module.exports = {};

app.listen = function listen() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
};
```

上面代码就是调用原生`http`模块创建了一个服务器，但是传的参数是`this`，这里的`this`是什么呢？回想一下我们使用`express`的时候是这样用的：

```javascript
const app = express();

app.listen(3000);
```

所以`listen`方法的实际调用者是`express()`的返回值，也就是上面`express.js`里面`createApplication`的返回值，也就是这个函数:

```javascript
var app = function (req, res) {
};
```

所以这里的`this`也是这个函数，所以我在`express.js`里面就加了注释，这个函数是`http.createServer`的回调函数。现在这个函数是空的，实际上他应该是整个`web服务器`的处理入口，所以我们给他加上处理的逻辑，在里面再加一行代码：

```javascript
var app = function(req, res) {
  app.handle(req, res);    // 这是真正的服务器处理入口
};
```

### app.handle

`app.handle`也是挂载在`app`下面的，所以他实际也在`application.js`这个文件里面，下面我们来看看他干了什么：

```javascript
app.handle = function handle(req, res) {
  var router = this._router;

  // 最终的处理方法
  var done = finalhandler(req, res);

  // 如果没有定义router
  // 直接结束返回
  if (!router) {
    done();
    return;
  }

  // 有router，就用router来处理
  router.handle(req, res, done);
}
```

上面代码可以看出，实际处理路由的是`router`，这是`Router`的一个实例，并且挂载在`this`上的，我们这里还没有给他赋值，如果没有赋值的话，会直接运行`finalhandler`并且结束处理。`finalhandler`也是一个第三方库，GitHub链接在这里：[https://github.com/pillarjs/finalhandler](https://github.com/pillarjs/finalhandler)。这个库的功能也不复杂，就是帮你处理一些收尾的工作，比如所有路由都没匹配上，你可能需要返回`404`并记录下`error log`，这个库就可以帮你做。

### app.get

上面说了，在具体处理网络请求时，实际上是用`app._router`来处理的，那么`app._router`是在哪里赋值的呢？事实上`app._router`的赋值有多个地方，一个地方就是`HTTP`动词处理方法上，比如我们用到的`app.get`或者`app.post`。无论是`app.get`还是`app.post`都是调用的`router`方法来处理，所以可以统一用一个循环来写这一类的方法。

```javascript
// HTTP动词的方法
var methods = ['get', 'post'];
methods.forEach(function (method) {
  app[method] = function (path) {
    this.lazyrouter();

    var route = this._router.route(path);
    route[method].apply(route, Array.prototype.slice.call(arguments, 1));
    return this;
  }
});
```

上面代码`HTTP`动词都放到了一个数组里面，官方源码中这个数组也是一个第三方库维护的，名字就叫`methods`，GitHub地址在这里：[https://github.com/jshttp/methods](https://github.com/jshttp/methods)。我这个例子因为只需要两个动词，就简化了，直接用数组了。这段代码其实给`app`创建了跟每个动词同名的函数，所有动词的处理函数都是一样的，都是去调`router`里面的对应方法来处理。[这种将不同部分抽取出来，从而复用共同部分的代码，有点像我之前另一篇文章写过的设计模式----享元模式](https://juejin.im/post/6844904168017100813#heading-3)。

我们注意到上面代码除了调用`router`来处理路由外，还有一行代码：

```javascript
this.lazyrouter();
```

`lazyrouter`方法其实就是我们给`this._router`赋值的地方，代码也比较简单，就是检测下有没有`_router`，如果没有就给他赋个值，赋的值就是`Router`的一个实例：

```javascript
app.lazyrouter = function lazyrouter() {
  if (!this._router) {
    this._router = new Router();
  }
}
```

`app.listen`，`app.handle`和`methods`处理方法都在`application.js`里面，`application.js`源码在这里:[https://github.com/expressjs/express/blob/master/lib/application.js](https://github.com/expressjs/express/blob/master/lib/application.js)

### Router

写到这里我们发现我们已经使用了`Router`的多个`API`，比如：

> 1. `router.handle`
> 2. `router.route`
> 3. `route[method]`

所以我们来看下`Router`这个类，下面的代码是从源码中简化出来的：

```javascript
// router/index.js
var setPrototypeOf = require('setprototypeof');

var proto = module.exports = function () {
  function router(req, res, next) {
    router.handle(req, res, next);
  }

  setPrototypeOf(router, proto);

  return router;
}
```

这段代码对我来说是比较奇怪的，我们在执行`new Router()`的时候其实执行的是`new proto()`，`new proto()`并不是我奇怪的地方，奇怪的是他设置原型的方式。[我之前在讲JS的面向对象的文章](https://juejin.im/post/6844904069887164423)提到过如果你要给一个类加上类方法可以这样写：

```javascript
function Class() {}

Class.prototype.method1 = function() {}

var instance = new Class();
```

这样`instance.__proto__`就会指向`Class.prototype`，你就可使用`instance.method1`了。

`Express.js`的上述代码其实也是实现了类似的效果，`setprototypeof`又是一个第三方库，作用类似`Object.setPrototypeOf(obj, prototype)`，就是给一个对象设置原型，`setprototypeof`存在的意义就是兼容老标准的JS，也就是加了一些`polyfill`，[他的代码在这里](https://github.com/wesleytodd/setprototypeof/blob/master/index.js)。所以：

```javascript
setPrototypeOf(router, proto);
```

这行代码的意思就是让`router.__proto__`指向`proto`，`router`是你在`new proto()`时的返回对象，执行了上面这行代码，这个`router`就可以拿到`proto`上的全部方法了。像`router.handle`这种方法就可以挂载到`proto`上了，成为`proto.handle`。

绕了一大圈，其实就是JS面向对象的使用，给`router`添加类方法，但是为什么使用这么绕的方式，而不是像我上面那个`Class`那样用呢？这我就不是很清楚了，可能有什么历史原因吧。

### 路由架构

`Router`的基本结构知道了，要理解`Router`的具体代码，我们还需要对`Express`的路由架构有一个整体的认识。就以我们这两个示例API来说：

> get      /api/users
>
> post   /api/users

我们发现他们的`path`是一样的，都是`/api/users`，但是他们的请求方法，也就是`method`不一样。`Express`里面将`path`这一层提取出来作为了一个类，叫做`Layer`。但是对于一个`Layer`，我们只知道他的`path`，不知道`method`的话，是不能确定一个路由的，所以`Layer`上还添加了一个属性`route`，这个`route`上也存了一个数组，数组的每个项存了对应的`method`和回调函数`handle`。整个结构你可以理解成这个样子：

```javascript
const router = {
  stack: [
    // 里面很多layer
    {
      path: '/api/users'
      route: {
      	stack: [
          // 里面存了多个method和回调函数
          {
            method: 'get',
            handle: function1
          },
          {
            method: 'post',
            handle: function2
          }
        ]
    	}
    }
  ]
}
```

知道了这个结构我们可以猜到，整个流程可以分成两部分：**注册路由**和**匹配路由**。当我们写`app.get`和`app.post`这些方法时，其实就是在`router`上添加`layer`和`route`。当一个网络请求过来时，其实就是遍历`layer`和`route`，找到对应的`handle`拿出来执行。

**注意`route`数组里面的结构，每个项按理来说应该使用一种新的数据结构来存储，比如`routeItem`之类的。但是`Express`并没有这样做，而是将它和`layer`合在一起了，给`layer`添加了`method`和`handle`属性。这在初次看源码的时候可能造成困惑，因为`layer`同时存在于`router`的`stack`上和`route`的`stack上`，肩负了两种职责。**

### router.route

这个方法是我们前面注册路由的时候调用的一个方法，回顾下前面的注册路由的方法，比如`app.get`：

```javascript
app.get = function (path) {
  this.lazyrouter();

  var route = this._router.route(path);
  route.get.apply(route, Array.prototype.slice.call(arguments, 1));
  return this;
}
```

结合上面讲的路由架构，我们在注册路由的时候，应该给`router`添加对应的`layer`和`route`，`router.route`的代码就不难写出了：

```javascript
proto.route = function route(path) {
  var route = new Route();
  var layer = new Layer(path, route.dispatch.bind(route));     // 参数是path和回调函数

  layer.route = route;

  this.stack.push(layer);

  return route;
}
```

### Layer和Route构造函数

上面代码新建了`Route`和`Layer`实例，这两个类的构造函数其实也挺简单的。只是参数的申明和初始化：

```javascript
// layer.js
module.exports = Layer;

function Layer(path, fn) {
  this.path = path;

  this.handle = fn;
  this.method = '';
}
```

```javascript
// route.js
module.exports = Route;

function Route() {
  this.stack = [];
  this.methods = {};    // 一个加快查找的hash表
}
```

### route.get

前面我们看到了`app.get`其实通过下面这行代码，最终调用的是`route.get`：

```javascript
route.get.apply(route, Array.prototype.slice.call(arguments, 1));
```

也知道了`route.get`这种动词处理函数，其实就是往`route.stack`上添加`layer`，那我们的`route.get`也可以写出来了：

```javascript
var methods = ["get", "post"];
methods.forEach(function (method) {
  Route.prototype[method] = function () {
    // 支持传入多个回调函数
    var handles = flatten(slice.call(arguments));

    // 为每个回调新建一个layer，并加到stack上
    for (var i = 0; i < handles.length; i++) {
      var handle = handles[i];

      // 每个handle都应该是个函数
      if (typeof handle !== "function") {
        var type = toString.call(handle);
        var msg =
          "Route." +
          method +
          "() requires a callback function but got a " +
          type;
        throw new Error(msg);
      }

      // 注意这里的层级是layer.route.layer
      // 前面第一个layer已经做个path的比较了，所以这里是第二个layer，path可以直接设置为/
      var layer = new Layer("/", handle);
      layer.method = method;
      this.methods[method] = true; // 将methods对应的method设置为true，用于后面的快速查找
      this.stack.push(layer);
    }
  };
});
```

这样，其实整个`router`的结构就构建出来了，后面就看看怎么用这个结构来处理请求了，也就是`router.handle`方法。

### router.handle

前面说了`app.handle`实际上是调用的`router.handle`，也知道了`router`的结构是在`stack`上添加了`layer`和`router`，所以`router.handle`需要做的就是从`router.stack`上找出对应的`layer`和`router`并执行回调函数：

```javascript
// 真正处理路由的函数
proto.handle = function handle(req, res, done) {
  var self = this;
  var idx = 0;
  var stack = self.stack;

  // next方法来查找对应的layer和回调函数
  next();
  function next() {
    // 使用第三方库parseUrl获取path，如果没有path，直接返回
    var path = parseUrl(req).pathname;
    if (path == null) {
      return done();
    }

    var layer;
    var match;
    var route;

    while (match !== true && idx < stack.length) {
      layer = stack[idx++]; // 注意这里先执行 layer = stack[idx]; 再执行idx++;
      match = layer.match(path); // 调用layer.match来检测当前路径是否匹配
      route = layer.route;

      // 没匹配上，跳出当次循环
      if (match !== true) {
        continue;
      }

      // layer匹配上了，但是没有route，也跳出当次循环
      if (!route) {
        continue;
      }

      // 匹配上了，看看route上有没有对应的method
      var method = req.method;
      var has_method = route._handles_method(method);
      // 如果没有对应的method，其实也是没匹配上，跳出当次循环
      if (!has_method) {
        match = false;
        continue;
      }
    }

    // 循环完了还没有匹配的，就done了，其实就是404
    if (match !== true) {
      return done();
    }

    // 如果匹配上了，就执行对应的回调函数
    return layer.handle_request(req, res, next);
  }
};
```

上面代码还用到了几个`Layer`和`Route`的实例方法： 

> **layer.match(path)**: 检测当前`layer`的`path`是否匹配。
>
> **route._handles_method(method)**：检测当前`route`的`method`是否匹配。
>
> **layer.handle_request(req, res, next)**：使用`layer`的回调函数来处理请求。

这几个方法看起来并不复杂，我们后面一个一个来实现。

到这里其实还有个疑问。从他整个的匹配流程来看，他寻找的其实是`router.stack.layer`这一层，但是最终应该执行的回调却是在`router.stack.layer.route.stack.layer.handle`。这是怎么通过`router.stack.layer`找到最终的`router.stack.layer.route.stack.layer.handle`来执行的呢？

这要回到我们前面的`router.route`方法：

```javascript
proto.route = function route(path) {
  var route = new Route();
  var layer = new Layer(path, route.dispatch.bind(route));

  layer.route = route;

  this.stack.push(layer);

  return route;
}
```

这里我们`new Layer`的时候给的回调其实是`route.dispatch.bind(route)`，这个方法会再去`route.stack`上找到正确的`layer`来执行。所以`router.handle`真正的流程其实是：

> 1. 找到`path`匹配的`layer`
> 2. 拿出`layer`上的`route`，看看有没有匹配的`method`
> 3. `layer`和`method`都有匹配的，再调用`route.dispatch`去找出真正的回调函数来执行。

所以又多了一个需要实现的函数,`route.dispatch`。

### layer.match

`layer.match`是用来检测当前`path`是否匹配的函数，用到了一个第三方库`path-to-regexp`，这个库可以将`path`转为正则表达式，方便后面的匹配，这个库在[之前写过的`react-router`源码](https://juejin.im/post/6855129007949398029#heading-8)中也出现过。

```javascript
var pathRegexp = require("path-to-regexp");

module.exports = Layer;

function Layer(path, fn) {
  this.path = path;

  this.handle = fn;
  this.method = "";

  // 添加一个匹配正则
  this.regexp = pathRegexp(path);
  // 快速匹配/
  this.regexp.fast_slash = path === "/";
}
```

然后就可以添加`match`实例方法了：

```javascript
Layer.prototype.match = function match(path) {
  var match;

  if (path != null) {
    if (this.regexp.fast_slash) {
      return true;
    }

    match = this.regexp.exec(path);
  }

  // 没匹配上，返回false
  if (!match) {
    return false;
  }

  // 不然返回true
  return true;
};
```

### layer.handle_request

`layer.handle_request`是用来调用具体的回调函数的方法，其实就是拿出`layer.handle`来执行：

```javascript
Layer.prototype.handle_request = function handle(req, res, next) {
  var fn = this.handle;

  fn(req, res, next);
};
```

### route._handles_method

`route._handles_method`就是检测当前`route`是否包含需要的`method`，因为之前添加了一个`methods`对象，可以用它来进行快速查找：

```javascript
Route.prototype._handles_method = function _handles_method(method) {
  var name = method.toLowerCase();

  return Boolean(this.methods[name]);
};
```

### route.dispatch

`route.dispatch`其实是`router.stack.layer`的回调函数，作用是找到对应的`router.stack.layer.route.stack.layer.handle`并执行。

```javascript
Route.prototype.dispatch = function dispatch(req, res, done) {
  var idx = 0;
  var stack = this.stack; // 注意这个stack是route.stack

  // 如果stack为空，直接done
  // 这里的done其实是router.stack.layer的next
  // 也就是执行下一个router.stack.layer
  if (stack.length === 0) {
    return done();
  }

  var method = req.method.toLowerCase();

  // 这个next方法其实是在router.stack.layer.route.stack上寻找method匹配的layer
  // 找到了就执行layer的回调函数
  next();
  function next() {
    var layer = stack[idx++];
    if (!layer) {
      return done();
    }

    if (layer.method && layer.method !== method) {
      return next();
    }

    layer.handle_request(req, res, next);
  }
};
```

到这里其实`Express`整体的路由结构，注册和执行流程都完成了，贴下对应的官方源码：

> **Router类**：[https://github.com/expressjs/express/blob/master/lib/router/index.js](https://github.com/expressjs/express/blob/master/lib/router/index.js)
>
> **Layer类**：[https://github.com/expressjs/express/blob/master/lib/router/layer.js](https://github.com/expressjs/express/blob/master/lib/router/layer.js)
>
> **Route类**：[https://github.com/expressjs/express/blob/master/lib/router/route.js](https://github.com/expressjs/express/blob/master/lib/router/route.js)

### 中间件

其实我们前面已经隐含了中间件，从前面的结构可以看出，一个网络请求过来，会到`router`的第一个`layer`，然后调用`next`到到第二个`layer`，匹配上`layer`的`path`就执行回调，然后一直这样把所有的`layer`都走完。所以中间件是啥？中间件就是一个`layer`，他的`path`默认是`/`，也就是对所有请求都生效。按照这个思路，代码就简单了：

```javascript
// application.js

// app.use就是调用router.use
app.use = function use(fn) {
  var path = "/";

  this.lazyrouter();
  var router = this._router;
  router.use(path, fn);
};
```

然后在`router.use`里面再加一层`layer`就行了：

```javascript
proto.use = function use(path, fn) {
  var layer = new Layer(path, fn);

  this.stack.push(layer);
};
```

## 总结

1. `Express`也是用原生API`http.createServer`来实现的。
2. `Express`的主要工作是将`http.createServer`的回调函数拆出来了，构建了一个路由结构`Router`。
3. 这个路由结构由很多层`layer`组成。
4. 一个中间件就是一个`layer`。
5. 路由也是一个`layer`，`layer`上有一个`path`属性来表示他可以处理的API路径。
6. `path`可能有不同的`method`，每个`method`对应`layer.route`上的一个`layer`。
7. `layer.route`上的`layer`虽然名字和`router`上的`layer`一样，但是功能侧重点并不一样，这也是源码中让人困惑的一个点。
8. `layer.route`上的`layer`的主要参数是`method`和`handle`，如果`method`匹配了，就执行对应的`handle`。
9. 整个路由匹配过程其实就是遍历`router.layer`的一个过程。
10. 每个请求来了都会遍历一遍所有的`layer`，匹配上就执行回调，一个请求可能会匹配上多个`layer`。
11. 总体来看，`Express`代码给人的感觉并不是很完美，特别是`Layer`类肩负两种职责，跟软件工程强调的`单一职责`原则不符，这也导致`Router`，`Layer`，`Route`三个类的调用关系有点混乱。而且对于继承和原型的使用都是很老的方式。可能也是这种不完美催生了`Koa`的诞生，下一篇文章我们就来看看`Koa`的源码吧。
12. `Express`其实还对原生的`req`和`res`进行了扩展，让他们变得更好用，但是这个其实只相当于一个语法糖，对整体架构没有太大影响，所以本文就没涉及了。

**本文可运行代码已经上传GitHub，拿下来一边玩代码，一边看文章效果更佳：[https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/Node.js/Express](https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/Node.js/Express)**

## 参考资料

Express官方文档：[http://expressjs.com/](http://expressjs.com/)

Express官方源码：[https://github.com/expressjs/express/tree/master/lib](https://github.com/expressjs/express/tree/master/lib)

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

**我也搞了个公众号[进击的大前端]，不打广告，不写水文，只发高质量原创，欢迎关注~**

