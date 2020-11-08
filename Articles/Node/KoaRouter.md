上一篇文章我们讲了`Koa`的基本架构，可以看到`Koa`的基本架构只有中间件内核，并没有其他功能，路由功能也没有。要实现路由功能我们必须引入第三方中间件，本文要讲的路由中间件是[@koa/router](https://github.com/koajs/router)，这个中间件是挂在`Koa`官方名下的，他跟另一个中间件[koa-router](https://github.com/ZijianHe/koa-router)名字很像。其实`@koa/router`是`fork`的`koa-router`，因为`koa-router`的作者很多年没维护了，所以`Koa`官方将它`fork`到了自己名下进行维护。这篇文章我们还是老套路，先写一个`@koa/router`的简单例子，然后自己手写`@koa/router`源码来替换他。

## 简单例子

我们这里的例子还是使用之前[Express文章中的例子](https://juejin.im/post/6890358903960240142)：

1. 访问跟路由返回`Hello World`
2. `get /api/users`返回一个用户列表，数据是随便造的
3. `post /api/users`写入一个用户信息，用一个文件来模拟数据库

这个例子之前写过几次了，用`@koa/router`写出来就是这个样子：

```javascript
const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");

const app = new Koa();
const router = new Router();

app.use(bodyParser());

router.get("/", (ctx) => {
  ctx.body = "Hello World";
});

router.get("/api/users", (ctx) => {
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

  ctx.body = resData;
});

router.post("/api/users", async (ctx) => {
  // 使用了koa-bodyparser才能从ctx.request拿到body
  const postData = ctx.request.body;

  // 使用fs.promises模块下的方法，返回值是promises
  await fs.promises.appendFile(
    path.join(__dirname, "db.txt"),
    JSON.stringify(postData)
  );

  ctx.body = postData;
});

app.use(router.routes());

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://127.0.0.1:${port}/`);
});
```

上述代码中需要注意，`Koa`主要提倡的是`promise`的用法，所以如果像之前那样使用回调方法可能会导致返回`Not Found`。比如在`post /api/users`这个路由中，我们会去写文件，如果我们还是像之前`Express`那样使用回调函数：

```javascript
fs.appendFile(path.join(__dirname, "db.txt"), postData, () => {
  ctx.body = postData;
});
```

这会导致这个路由的处理方法并不知道这里需要执行回调，而是直接将外层函数执行完就结束了。而外层函数执行完并没有设置`ctx`的返回值，所以`Koa`会默认返回一个`Not Found`。为了避免这种情况，我们需要让外层函数等待这里执行完，所以我们这里使用`fs.promises`下面的方法，这下面的方法都会返回`promise`，我们就可以使用`await`来等待返回结果了。

## 手写源码

本文手写源码全部参照官方源码写成，方法名和变量名尽可能与官方代码保持一致，大家可以对照着看，写到具体方法时我也会贴上官方源码地址。手写源码前我们先来看看有哪些API是我们需要解决的：

1. `Router`类：我们从`@koa/router`引入的就是这个类，通过`new`关键字生成一个实例`router`，后续使用的方法都挂载在这个实例下面。
2. `router.get`和`router.post`：`router`的实例方法`get`和`post`是我们定义路由的方法。
3. `router.routes`：这个实例方法的返回值是作为中间件传给`app.use`的，所以这个方法很可能是生成具体的中间件给`Koa`调用。

`@koa/router`的这种使用方法跟我们之前看过的[Express.js的路由模块](https://juejin.im/post/6890358903960240142#heading-6)有点像，如果之前看过`Express.js`源码解析的，看本文应该会有种似曾相识的感觉。

### 先看看路由架构

[Express.js源码解析里面](https://juejin.im/post/6890358903960240142#heading-6)我讲过他的路由架构，本文讲的`@koa/router`的架构跟他有很多相似之处，但是也有一些改进。在进一步深入`@koa/router`源码前，我们先来回顾下`Express.js`的路由架构，这样我们可以有一个整体的认识，可以更好的理解后面的源码。对于我们上面这个例子来说，他有两个API：

1. `get /api/users`
2. `post /api/users`

这两个API的`path`是一样的，都是`/api/users`，但是他们的`method`不一样，一个是`get`，一个是`post`。`Express`里面将`path`这一层提取出来单独作为了一个类----`Layer`。一个`Layer`对应一个`path`，但是同一个`path`可能对应多个`method`。所以`Layer`上还添加了一个属性`route`，`route`上也存了一个数组，数组的每个项存了对应的`method`和回调函数`handle`。所以整个结构就是这个样子：

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

整个路由的执行分为了两部分：**注册路由**和**匹配路由**。

**注册路由**就是构造上面这样一个结构，主要是通过请求动词对应的方法来实现，比如运行`router.get('/api/users', function1)`其实就会往`router`上添加一个`layer`，这个`layer`的`path`是`/api/users`，同时还会在`layer.route`的数组上添加一个项：

```javascript
{
  method: 'get',
  handle: function1
}
```

**匹配路由**就是当一个请求来了我们就去遍历`router`上的所有`layer`，找出`path`匹配的`layer`，再找出`layer`上`method`匹配的`route`，然后将对应的回调函数`handle`拿出来执行。

`@koa/router`有着类似的架构，他的代码就是在实现这种架构，先带着这种架构思维，我们可以很容易读懂他的代码。

### Router类

首先肯定是`Router`类，他的构造函数也比较简单，只需要初始化几个属性就行。[由于`@koa/router`模块大量使用了面向对象的思想，如果你对JS的面向对象还不熟悉，可以先看看这篇文章。](https://juejin.im/post/6844904069887164423)

```javascript
module.exports = Router;

function Router() {
  // 支持无new直接调用
  if (!(this instanceof Router)) return new Router();

  this.stack = []; // 变量名字都跟Express.js的路由模块一样
}
```

上面代码有一行比较有意思

```javascript
if (!(this instanceof Router)) return new Router();
```

这种使用方法我在其他文章也提到过：支持无`new`调用。我们知道要实例化一个类，一般要使用`new`关键字，比如`new Router()`。但是如果`Router`构造函数加了这行代码，就可以支持无`new`调用了，直接`Router()`可以达到同样的效果。这是因为如果你直接`Router()`调用，`this instanceof Router`返回为`false`，会走到这个`if`里面去，构造函数会帮你调用一下`new Router()`。

所以这个构造函数的主要作用就是初始化了一个属性`stack`，嗯，这个属性名字都跟`Express.js`路由模块一样。前面的架构已经说了，这个属性就是用来存放`layer`的。

`Router`构造函数官方源码:[https://github.com/koajs/router/blob/master/lib/router.js#L50](https://github.com/koajs/router/blob/master/lib/router.js#L50)

### 请求动词函数

前面架构讲了，作为一个路由模块，我们主要解决两个问题：**注册路由**和**匹配路由**。

先来看看注册路由，注册路由主要是在请求动词函数里面进行的，比如`router.get`和`router.post`这种函数。`HTTP`动词有很多，有一个库专门维护了这些动词：[methods](https://github.com/jshttp/methods)。`@koa/router`也是用的这个库，我们这里就简化下，直接一个将`get`和`post`放到一个数组里面吧。

```javascript
// HTTP动词函数
const methods = ["get", "post"];
for (let i = 0; i < methods.length; i++) {
  const method = methods[i];

  Router.prototype[method] = function (path, middleware) {
    // 将middleware转化为一个数组，支持传入多个回调函数
    middleware = Array.prototype.slice.call(arguments, 1);

    this.register(path, [method], middleware);

    return this;
  };
}
```

上面代码直接循环`methods`数组，将里面的每个值都添加到`Router.prototype`上成为一个实例方法。这个方法接收`path`和`middleware`两个参数，这里的`middleware`其实就是我们路由的回调函数，因为代码是取的`arguments`第二个开始到最后所有的参数，所以其他他是支持同时传多个回调函数 的。另外官方源码其实是三个参数，还有可选参数`name`，因为是可选的，跟核心逻辑无关，我这里直接去掉了。

还需要注意这个实例方法最后返回了`this`，这种操作我们在`Koa`源码里面也见过，目的是让用户可以连续点点点，比如这样：

```javascript
router.get().post();
```

这些实例方法最后其实都是调`this.register()`去注册路由的，下面我们看看他是怎么写的。

请求动词函数官方源码：[https://github.com/koajs/router/blob/master/lib/router.js#L189](https://github.com/koajs/router/blob/master/lib/router.js#L189)

### router.register()

`router.register()`实例方法是真正注册路由的方法，结合前面架构讲的，注册路由就是构建`layer`的数据结构可知，`router.register()`的主要作用就是构建数据结构：

```javascript
Router.prototype.register = function (path, methods, middleware) {
  const stack = this.stack;

  const route = new Layer(path, methods, middleware);

  stack.push(route);

  return route;
};
```

代码跟预期的一样，就是用`path`，`method`和`middleware`来创建一个`layer`实例，然后把它塞到`stack`数组里面去。

`router.register`官方源码：[https://github.com/koajs/router/blob/master/lib/router.js#L553](https://github.com/koajs/router/blob/master/lib/router.js#L553)

### Layer类

上面代码出现了`Layer`这个类，我们来看看他的构造函数吧：

```javascript
const { pathToRegexp } = require("path-to-regexp");

module.exports = Layer;

function Layer(path, methods, middleware) {
  // 初始化methods和stack属性
  this.methods = [];
  // 注意这里的stack存放的是我们传入的回调函数
  this.stack = Array.isArray(middleware) ? middleware : [middleware];

  // 将参数methods一个一个塞进this.methods里面去
  for (let i = 0; i < methods.length; i++) {
    this.methods.push(methods[i].toUpperCase());    // ctx.method是大写，注意这里转换为大写
  }

  // 保存path属性
  this.path = path;
  // 使用path-to-regexp库将path转化为正则
  this.regexp = pathToRegexp(path);
}
```

从`Layer`的构造函数可以看出，他的架构跟`Express.js`路由模块已经有点区别了。`Express.js`的`Layer`上还有`Route`这个概念。而`@koa/router`的`stack`上存的直接是回调函数了，已经没有`route`这一层了。我个人觉得这种层级结构是比`Express`的要清晰的，因为`Express`的`route.stack`里面存的又是`layer`，这种相互引用是有点绕的，这点我在[Express源码解析中也提出过](https://juejin.im/post/6890358903960240142)。

另外我们看到他也用到了[`path-to-regexp`这个库](https://github.com/pillarjs/path-to-regexp)，这个库我在很多处理路由的库里面都见到过，比如`React-Router`，`Express`，真想去看看他的源码，加到我的待写文章列表里面去，空了去看看~

`Layer`构造函数官方源码：[https://github.com/koajs/router/blob/master/lib/layer.js#L20](https://github.com/koajs/router/blob/master/lib/layer.js#L20)

### router.routes()

前面架构提到的还有件事情需要做，那就是**路由匹配**。

对于`Koa`来说，一个请求来了会依次经过每个中间件，所以我们的路由匹配其实也是在中间件里面做的。而`@koa/router`的中间件是通过`router.routes()`返回的。所以`router.routes()`主要做两件事：

1. 他应该返回一个`Koa`中间件，以便`Koa`调用
2. 这个中间件的主要工作是遍历`router`上的`layer`，找到匹配的路由，并拿出来执行。

```javascript
Router.prototype.routes = function () {
  const router = this;

  // 这个dispatch就是我们要返回给Koa调用的中间件
  let dispatch = function dispatch(ctx, next) {
    const path = ctx.path;
    const matched = router.match(path, ctx.method); // 获取所有匹配的layer

    let layerChain; // 定义一个变量来串联所有匹配的layer

    ctx.router = router; // 顺手把router挂到ctx上，给其他Koa中间件使用

    if (!matched.route) return next(); // 如果一个layer都没匹配上，直接返回，并执行下一个Koa中间件

    const matchedLayers = matched.pathAndMethod; // 获取所有path和method都匹配的layer
    // 下面这段代码的作用是将所有layer上的stack，也就是layer的回调函数都合并到一个数组layerChain里面去
    layerChain = matchedLayers.reduce(function (memo, layer) {
      return memo.concat(layer.stack);
    }, []);

    // 这里的compose也是koa-compose这个库，源码在讲Koa源码的时候讲过
    // 使用compose将layerChain数组合并成一个可执行的方法，并拿来执行，传入参数是Koa中间件参数ctx, next
    return compose(layerChain)(ctx, next);
  };

  // 将中间件返回
  return dispatch;
};
```

上述代码中主体返回的是一个`Koa`中间件，这个中间件里面先是通过`router.match`方法将所有匹配的`layer`拿出来，然后将这些`layer`对应的回调函数通过`reduce`放到一个数组里面，也就是`layerChain`。然后用`koa-compose`将这个数组合并成一个可执行方法，**这里就有问题了**。之前在`Koa`源码解析我讲过`koa-compose`的源码，这里再大致贴一下：

```javascript
function compose(middleware) {
  // 参数检查，middleware必须是一个数组
  if (!Array.isArray(middleware))
    throw new TypeError("Middleware stack must be an array!");
  // 数组里面的每一项都必须是一个方法
  for (const fn of middleware) {
    if (typeof fn !== "function")
      throw new TypeError("Middleware must be composed of functions!");
  }

  // 返回一个方法，这个方法就是compose的结果
  // 外部可以通过调用这个方法来开起中间件数组的遍历
  // 参数形式和普通中间件一样，都是context和next
  return function (context, next) {
    return dispatch(0); // 开始中间件执行，从数组第一个开始

    // 执行中间件的方法
    function dispatch(i) {
      let fn = middleware[i]; // 取出需要执行的中间件

      // 如果i等于数组长度，说明数组已经执行完了
      if (i === middleware.length) {
        fn = next; // 这里让fn等于外部传进来的next，其实是进行收尾工作，比如返回404
      }

      // 如果外部没有传收尾的next，直接就resolve
      if (!fn) {
        return Promise.resolve();
      }

      // 执行中间件，注意传给中间件接收的参数应该是context和next
      // 传给中间件的next是dispatch.bind(null, i + 1)
      // 所以中间件里面调用next的时候其实调用的是dispatch(i + 1)，也就是执行下一个中间件
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
```

这段代码里面`fn`是我们传入的中间件，在`@koa/router`这里对应的其实是`layerChain`里面的一项，执行`fn`的时候是这样的:

```javascript
fn(context, dispatch.bind(null, i + 1))
```

这里传的参数符合我们使用`@koa/router`的习惯，我们使用`@koa/router`一般是这样的：

```javascript
router.get("/", (ctx, next) => {
  ctx.body = "Hello World";
});
```

上面的`fn`就是我们传的回调函数，注意我们执行`fn`时传入的第二个参数`dispatch.bind(null, i + 1)`，也就是`router.get`这里的`next`。所以我们上面回调函数里面再执行下`next`：

```javascript
router.get("/", (ctx, next) => {
  ctx.body = "Hello World";
  next();    // 注意这里
});
```

这个回调里面执行`next()`其实就是把`koa-compose`里面的`dispatch.bind(null, i + 1)`拿出来执行，也就是`dispatch(i + 1)`，对应的就是执行`layerChain`里面的下一个函数。在这个例子里面并没有什么用，因为匹配的回调函数只有一个。但是如果`/`这个路径匹配了多个回调函数，比如这样：

```javascript
router.get("/", (ctx, next) => {
  console.log("123");
});

router.get("/", (ctx, next) => {
  ctx.body = "Hello World";
});
```

这里`/`就匹配了两个回调函数，但是你如果这么写，你会得到一个`Not Found`。为什么呢？因为你第一个回调里面没有调用`next()`!前面说了，这里的`next()`是`dispatch(i + 1)`，会去调用`layerChain`里面的下一个回调函数，换一句说，**你这里不调`next()`就不会运行下一个回调函数了！**要想让`/`返回`Hello World`，我们需要在第一个回调函数里面调用`next`，像这样：

```javascript
router.get("/", (ctx, next) => {
  console.log("123");
  next();     // 记得调用next
});

router.get("/", (ctx, next) => {
  ctx.body = "Hello World";
});
```

所以有朋友觉得`@koa/router`回调函数里面的`next`没什么用，如果你一个路由只有一个匹配的回调函数，那确实没什么用，但是如果你一个路径可能匹配多个回调函数，记得调用`next`。

`router.routes`官方源码：[https://github.com/koajs/router/blob/master/lib/router.js#L335](https://github.com/koajs/router/blob/master/lib/router.js#L335)

### router.match()

上面`router.routes`的源码里面我们用到了`router.match`这个实例方法来查找所有匹配的`layer`，上面是这么用的：

```javascript
const matched = router.match(path, ctx.method);
```

所以我们也需要写一下这个函数，这个函数不复杂，通过传入的`path`和`method`去`router.stack`上找到所有匹配的`layer`就行：

```javascript
Router.prototype.match = function (path, method) {
  const layers = this.stack; // 取出所有layer

  let layer;
  // 构建一个结构来保存匹配结果，最后返回的也是这个matched
  const matched = {
    path: [], // path保存仅仅path匹配的layer
    pathAndMethod: [], // pathAndMethod保存path和method都匹配的layer
    route: false, // 只要有一个path和method都匹配的layer，就说明这个路由是匹配上的，这个变量置为true
  };

  // 循环layers来进行匹配
  for (let i = 0; i < layers.length; i++) {
    layer = layers[i];
    // 匹配的时候调用的是layer的实例方法match
    if (layer.match(path)) {
      matched.path.push(layer); // 只要path匹配就先放到matched.path上去

      // 如果method也有匹配的，将layer放到pathAndMethod里面去
      if (~layer.methods.indexOf(method)) {
        matched.pathAndMethod.push(layer);
        if (layer.methods.length) matched.route = true;
      }
    }
  }

  return matched;
};
```

上面代码只是循环了所有的`layer`，然后将匹配的`layer`放到一个对象`matched`里面并返回给外面调用，`match.path`保存了所有`path`匹配，但是`method`并不一定匹配的`layer`，本文并没有用到这个变量。具体匹配`path`其实还是调用的`layer`的实例方法`layer.match`，我们后面会来看看。

这段代码还有个有意思的点是检测`layer.methods`里面是否包含`method`的时候，源码是这样用的：

```javascript
~layer.methods.indexOf(method)
```

而一般我们可能是这样用:

```javascript
layer.methods.indexOf(method) > -1
```

这个源码里面的`~`是按位取反的意思，达到的效果与我们下面这行代码其实是一样的，因为:

```javascript
~ -1;      // 返回0，也就是false
~ 0;       // 返回-1, 注意-1转换为bool是true
~ 1;       // 返回-2，转换为bool也是true
```

这种用法可以少写几个字母，又学会一招，大家具体使用的还是根据自己的情况来吧，选取喜欢的方式。

`router.match`官方源码：[https://github.com/koajs/router/blob/master/lib/router.js#L669](https://github.com/koajs/router/blob/master/lib/router.js#L669)

### layer.match()

上面用到了`layer.match`这个方法，我们也来写一下吧。因为我们在创建`layer`实例的时候，其实已经将`path`转换为了一个正则，我们直接拿来用就行：

```javascript
Layer.prototype.match = function (path) {
  return this.regexp.test(path);
};
```

`layer.match`官方源码：[https://github.com/koajs/router/blob/master/lib/layer.js#L54](https://github.com/koajs/router/blob/master/lib/layer.js#L54)

## 总结

到这里，我们自己的`@koa/router`就写完了，使用他替换官方的源码也能正常工作啦~

本文可运行代码已经上传到GitHub，大家可以拿下来玩玩：

最后我们再来总结下本文的要点吧：

1. `@koa/router`整体是作为一个`Koa`中间件存在的。
2. `@koa/router`是`fork`的`koa-router`继续进行维护。
3. `@koa/router`的整体思路跟`Express.js`路由模块很像。
4. `@koa/router`也可以分为**注册路由**和**匹配路由**两部分。
5. **注册路由**主要是构建路由的数据结构，具体来说就是创建很多`layer`，每个`layer`上保存具体的`path`，`methods`，和回调函数。
6. `@koa/router`创建的数据结构跟`Express.js`路由模块有区别，少了`route`这个层级，但是个人觉得`@koa/router`的这种结构反而更清晰。`Express.js`的`layer`和`route`的相互引用反而更让人疑惑。
7. **匹配路由**就是去遍历所有的`layer`，找出匹配的`layer`，将回调方法拿来执行。
8. 一个路由可能匹配多个`layer`和回调函数，执行时使用`koa-compose`将这些匹配的回调函数串起来，一个一个执行。
9. 需要注意的是，如果一个路由匹配了多个回调函数，前面的回调函数必须调用`next()`才能继续走到下一个回调函数。

## 参考资料

`@koa/router`官方文档：[https://github.com/koajs/router](https://github.com/koajs/router)

`@koa/router`源码地址：[https://github.com/koajs/router/tree/master/lib](https://github.com/koajs/router/tree/master/lib)

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

**我也搞了个公众号[进击的大前端]，不打广告，不写水文，只发高质量原创，欢迎关注~**