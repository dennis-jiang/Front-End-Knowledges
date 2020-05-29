## 为什么要提高代码扩展性

我们写的代码都是为了一定的需求服务的，但是这些需求并不是一成不变的，当需求变更了，如果我们代码的扩展性很好，我们可能只需要简单的添加或者删除模块就行了，如果扩展性不好，可能所有代码都需要重写，那就是一场灾难了，所以提高代码的扩展性是势在必行的。怎样才算有好的扩展性呢？好的扩展性应该具备以下特征:

> 1. 需求变更时，代码不需要重写。
> 2. 局部代码的修改不会引起大规模的改动。有时候我们去重构一小块代码，但是发现他跟其他代码都是杂糅在一起的，里面各种耦合，一件事情拆在几个地方做，要想改这一小块必须要改很多其他代码。那说明这些代码的耦合太高，扩展性不强。
> 3. 可以很方便的引入新功能和新模块。

## 怎么提高代码扩展性？

当然是从优秀的代码身上学习了，本文会深入`Axios`，`Node.js`，`Vue`等优秀框架，从他们源码总结几种设计模式出来，然后再用这些设计模式尝试解决下工作中遇到的问题。本文主要会讲`职责链模式`，`观察者模式`，`适配器模式`，`装饰器模式`。下面一起来看下吧：

## 职责链模式

职责链模式顾名思义就是一个链条，这个链条上串联了很多的职责，一个事件过来，可以被链条上的职责依次处理。他的好处是链条上的各个职责，只需要关心自己的事情就行了，不需要知道自己的上一步是什么，下一步是什么，跟上下的职责都不耦合，这样当上下职责变化了，自己也不受影响，往链条上添加或者减少职责也非常方便。

### 实例：Axios拦截器

用过Axios的朋友应该知道，Axios的拦截器有`请求拦截器`和`响应拦截器`，执行的顺序是`请求拦截器 -> 发起请求 -> 响应拦截器`，这其实就是一个链条上串起了三个职责。下面我们来看看这个链条怎么实现：

```javascript
// 先从用法入手，一般我们添加拦截器是这样写的 
// instance.interceptors.request.use(fulfilled, rejected)
// 根据这个用法我们先写一个`Axios`类。
function Axios() {
  // 实例上有个interceptors对象，里面有request和response两个属性
  // 这两个属性都是InterceptorManager的实例
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

// 然后是实现InterceptorManager类
function InterceptorManager() {
  // 实例上有一个数组，存储拦截器方法
  this.handlers = [];
}

// InterceptorManager有一个实例方法use
InterceptorManager.prototype.use = function(fulfilled, rejected) {
  // 这个方法很简单，把传入的回调放到handlers里面就行
  this.handlers.push({
    fulfilled,
    rejected
  })
}
```

上面的代码其实就完成了拦截器创建和`use`的逻辑，并不复杂，那这些拦截器方法都是什么时候执行呢？当然是我们调用`instance.request`的时候，调用`instance.request`的时候真正执行的就是`请求拦截器 -> 发起请求 -> 响应拦截器`链条，所以我们还需要来实现下`Axios.prototype.request`:

```javascript
Axios.prototype.request = function(config) {
  // chain里面存的就是我们要执行的方法链条
  // dispatchRequest是发起网络请求的方法，本文主要讲设计模式，这个方法就不实现了
  // chain里面先把发起网络请求的方法放进去，他的位置应该在chain的中间
  const chain = [dispatchRequest, undefined];
  
  // chain前面是请求拦截器的方法,从request.handlers里面取出来放进去
  this.interceptors.request.handlers.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  
  // chain后面是响应拦截器的方法，从response.handlers里面取出来放进去
  this.interceptors.response.handlers.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });
  
  // 经过上述代码的组织，chain这时候是这样的：
  // [request.fulfilled, request.rejected, dispatchRequest, undefined, response.fulfilled,  
  // response.rejected]
  // 这其实已经按照请求拦截器 -> 发起请求 -> 响应拦截器的顺序排好了，拿来执行就行
  
  let promise = Promise.resolve(config);   // 先来个空的promise，好开启then
  while (chain.length) {
    // 用promise.then进行链式调用
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
}
```

上述代码是从[Axios源码](https://github.com/axios/axios/tree/master/lib/core)中精简出来的，可以看出他巧妙的运用了职责链模式，将需要做的任务组织成一个链条，这个链条上的任务相互不影响，拦截器可有可无，而且可以有多个，兼容性非常强。

### 实例：职责链组织表单验证

看了优秀框架对职责链模式的运用，我们再看看在我们平时工作中这个模式怎么运用起来。现在假设有这样一个需求是做一个表单验证，这个验证需要前端先对格式等内容进行校验，然后API发给后端进行合法性校验。我们先分析下这个需求，前端校验是同步的，后端验证是异步的，整个流程是同步异步交织的，为了能兼容这种情况，我们的每个验证方法的返回值都需要包装成promise才行

```javascript
// 前端验证先写个方法
function frontEndValidator(inputValue) {
  return Promise.resolve(inputValue);      // 注意返回值是个promise
}

// 后端验证也写个方法
function backEndValidator(inputValue) {
  return Promise.resolve(inputValue);      
}

// 写一个验证器
function validator(inputValue) {
  // 仿照Axios，将各个步骤放入一个数组
  const validators = [frontEndValidator, backEndValidator];
  
  // 前面Axios是循环调用promise.then来执行的职责链，我们这里换个方式，用async来执行下
  async function runValidate() {
    let result = inputValue;
    while(validators.length) {
      result = await validators.shift()(result);
    }
    
    return result;
  }
  
  // 执行runValidate，注意返回值也是一个promise
  runValidate().then((res) => {console.log(res)});
}

// 上述代码已经可以执行了，只是我们没有具体的校验逻辑，输入值会原封不动的返回
validator(123);     // 输出: 123
```

上述代码我们用职责链模式组织了多个校验逻辑，这几个校验之间相互之间没有依赖，如果以后需要减少某个校验，只需要将它从`validators`数组中删除即可，如果要添加就往这个数组添加就行了。这几个校验器之间的耦合度就大大降低了，而且他们封装的是promise，完全还可以用到其他模块去，其他模块根据需要组织自己的职责链就行了。

## 观察者模式

观察者模式还有个名字叫发布订阅模式，这在JS的世界里可是大名鼎鼎，大家或多或少都用到过，最常见的就是事件绑定了，有些面试还会要求面试者手写一个事件中心，其实就是一个观察者模式。观察者模式的优点是可以让事件的产生者和消费者相互不知道，只需要产生和消费相应的事件就行，特别适合事件的生产者和消费者不方便直接调用的情况，比如异步中。我们来手写一个看看：

```javascript
class PubSub {
  constructor() {
    // 一个对象存放所有的消息订阅
    // 每个消息对应一个数组，数组结构如下
    // {
    //   "event1": [cb1, cb2]
    // }
    this.events = {}
  }

  subscribe(event, callback) {
    if(this.events[event]) {
      // 如果有人订阅过了，这个键已经存在，就往里面加就好了
      this.events[event].push(callback);
    } else {
      // 没人订阅过，就建一个数组，回调放进去
      this.events[event] = [callback]
    }
  }

  publish(event, ...args) {
    // 取出所有订阅者的回调执行
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      subscribedEvents.forEach(callback => {
        callback.call(this, ...args);
      });
    }
  }

  unsubscribe(event, callback) {
    // 删除某个订阅，保留其他订阅
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
}

// 使用的时候
const pubSub = new PubSub();
pubSub.subscribe('event1', () => {});    // 注册事件
pubSub.publish('event1');                // 发布事件
```

### 实例：Node.js的EventEmitter

观察者模式的一个典型应用就是Node.js的EventEmitter，我有另一篇文章[从发布订阅模式入手读懂Node.js的EventEmitter源码](https://juejin.im/post/5e7978485188255e237c2a29)从异步应用的角度详细讲解了观察者模式的原理和Node.js的EventEmitter源码，我这里就不重复书写了，上面的手写代码也是来自这篇文章。

### 实例：转圈抽奖

一样的，看了优秀框架的源码，我们自己也要试着来用一下，这里的例子是转圈抽奖。想必很多朋友都在网上抽过奖，一个转盘，里面各种奖品，点一下抽奖，然后指针开始旋转，最后会停留到一个奖品那里。我们这个例子就是要实现这样一个Demo，但是还有一个要求是每转一圈速度就加快一点。我们来分析下这个需求:

> 1. 要转盘抽奖，我们肯定先要把转盘画出来。
> 2. 抽奖肯定会有个结果，有奖还是没奖，具体是什么奖品，一般这个结果都是API返回的，很多实现方案是点击抽奖就发起API请求拿到结果了，转圈动画只是个效果而已。
> 3. 我们写一点代码让转盘动起来，需要一个运动效果
> 4. 每转一圈我们需要加快速度，所以还需要控制运动的速度

通过上面的分析我们发现一个问题，转盘运动是需要一些时间的，当他运动完了需要告诉控制转盘的模块加快速度进行下一圈的运动，所以运动模块和控制模块需要一个异步通信，这种异步通信就需要我们的观察者模式来解决了。最终效果如下，由于只是个DEMO，我就用几个DIV块来代替转盘了：

![pubsub](../../images/DesignPatterns/Extendability/pubsub.gif)

下面是代码：

```javascript
// 先把之前的发布订阅模式拿过来
class PubSub {
  constructor() {
    this.events = {}
  }

  subscribe(event, callback) {
    if(this.events[event]) {
      this.events[event].push(callback);
    } else {
      this.events[event] = [callback]
    }
  }

  publish(event, ...args) {
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      subscribedEvents.forEach(callback => {
        callback.call(this, ...args);
      });
    }
  }

  unsubscribe(event, callback) {
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
}

// 实例化一个事件中心
const pubSub = new PubSub();

// 总共有 初始化页面 -> 获取最终结果 -> 运动效果 -> 运动控制 四个模块
// 初始化页面
const domArr = [];
function initHTML(target) {
  // 总共10个可选奖品，也就是10个DIV
  for(let i = 0; i < 10; i++) {
    let div = document.createElement('div');
    div.innerHTML = i;
    div.setAttribute('class', 'item');
    target.appendChild(div);
    domArr.push(div);
  }
}

// 获取最终结果，也就是总共需要转几次，我们采用一个随机数加40(4圈)
function getFinal() {
  let _num = Math.random() * 10 + 40;

  return Math.floor(_num, 0);
}

// 运动模块，具体运动方法
function move(moveConfig) {
  // moveConfig = {
  //   times: 10,     // 本圈移动次数
  //   speed: 50      // 本圈速度
  // }
  let current = 0; // 当前位置
  let lastIndex = 9;   // 上个位置

  const timer = setInterval(() => {
    // 每次移动给当前元素加上边框,移除上一个的边框
    if(current !== 0) {
      lastIndex = current - 1;
    }

    domArr[lastIndex].setAttribute('class', 'item');
    domArr[current].setAttribute('class', 'item item-on');

    current++;

    if(current === moveConfig.times) {
      clearInterval(timer);

      // 转完了一圈广播事件
      if(moveConfig.times === 10) {
        pubSub.publish('finish');
      }
    }
  }, moveConfig.speed);
}

// 运动控制模块，控制每圈的参数
function moveController() {
  let allTimes = getFinal();
  let circles = Math.floor(allTimes / 10, 0);
  let stopNum = allTimes % circles;
  let speed = 250;  
  let ranCircle = 0;

  move({
    times: 10,
    speed
  });    // 手动开启第一次旋转

  // 监听事件，每次旋转完成自动开启下一次旋转
  pubSub.subscribe('finish', () => {
    let time = 0;
    speed -= 50;
    ranCircle++;

    if(ranCircle <= circles) {
      time = 10;
    } else {
      time = stopNum;
    }

    move({
      times: time,
      speed,
    })
  });
}

// 绘制页面，开始转动
initHTML(document.getElementById('root'));
moveController();
```

上述代码的难点就在于运动模块的运动是异步的，需要在每圈运动完了之后通知运动控制模块进行下一次转动，观察者模式很好的解决了这个问题。[本例完整代码我已经上传到我的GitHub了，可以去拿下来运行下玩玩。](https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/DesignPatterns/Extendability)

## 装饰器模式

装饰器模式针对的情况是我有一些老代码，但是这些老代码功能不够，需要添加功能，但是我又不能去改老代码，比如Vue 2.x需要监听数组的改变，给他添加响应式，但是他又不能直接修改`Array.prototype`。这种情况下，就特别适合使用装饰者模式，给老方法重新装饰下，变成一个新方法来使用。

### 基本结构

装饰器模式的结构也很简单，就是先调用一下原来的方法，然后加上更多的操作，就是装饰一下。

```javascript
var a = {
  b: function() {}
}

function myB() {
  // 先调用以前的方法
  a.b();
  
  // 再加上自己的新操作
  console.log('新操作');
}
```

### 实例：Vue数组的监听

熟悉Vue响应式原理的朋友都知道([不熟悉的朋友可以看这里](https://juejin.im/post/5e1fcbf9e51d451c52193791))，Vue 2.x对象的响应式是通过`Object.defineProperty`实现的，但是这个方法不能监听数组的改变，那数组怎么监听的呢？数组操作一般就是`push`，`shift`这些方法，这些方法是数组原生的方法，我们当然不能去改他，那会了装饰器模式，我们完全可以在保持他之前功能的基础上给他扩展功能：

```javascript
var arrayProto = Array.prototype;    // 先拿到原生数组的原型
var arrObj = Object.create(arrayProto);     // 用原生数组的原型创建一个新对象，免得污染原生数组
var methods = ['push', 'shift'];    // 需要扩展的方法，这里只写了两个，但是不止这两个

// 循环methods数组，扩展他们
methods.forEach(function(method) {
  // 用扩展的方法替换arrObj上的方法
  arrObj[method] = function() {
    var result = arrayProto[method].apply(this, arguments);    // 先执行老方法
    dep.notify();     // 这个是Vue的方法，用来做响应式
    return result;
  }
});

// 对于用户定义的数组，手动将它的原型指向扩展了的arrObj
var a = [1, 2, 3];
a.__proto__ = arrObj;
```

上述代码是从[Vue源码精简过来的](https://github.com/vuejs/vue/blob/dev/src/core/observer/array.js)，其实就是一个典型的使用装饰器扩展原有方法的功能的例子，因为Vue只扩展了数组方法，如果你不通过这些方法，而是直接通过下标来操作数组，响应式就不起作用了。

### 实例：扩展已有的事件绑定

老规矩，学习了人家的代码，我们自己也来试试。这个例子面临的需求是我们需要对已有的DOM点击事件上增加一些操作。

```javascript
// 我们以前的点击事件只需要打印1
dom.onclick = function() {
  console.log(1);
}
```

但是我们现在的需求要求还要输出一个2，我们当然可以返回原来的代码将他改掉，但是我们也可以用装饰者模式给他添加功能：

```javascript
var oldFunc = dom.onclick;  // 先将老方法拿出来
dom.onclick = function() {   // 重新绑定事件
  oldFunc.apply(this, arguments);  // 先执行老的方法
  
  // 然后添加新的方法
  console.log(2);
}
```

上述代码就扩展了`dom`的点击事件，但是如果需要修改的DOM元素很多，我们要一个一个的去重新绑定事件，又会有大量相似代码，我们学设计模式的目的之一就是要避免重复代码，于是我们可以将公用的绑定操作提取出来，作为一个装饰器：

```javascript
var decorator = function(dom, fn) {
  var oldFunc = dom.onclick;
  
  if(typeof oldFunc === 'function'){
    dom.onclick = function() {
      oldFunc.apply(this, arguments);
      fn();
    }
  }
}

// 调用装饰器，传入参数就可以扩展了
decorator(document.getElementById('test'), function() {
  console.log(2);
})
```

这种方式特别适合我们引入的第三方UI组件，有些UI组件自己封装了很多功能，但是并没有暴露出接口，如果我们要添加功能，又不能直接修改他的源码，最好的方法就是这样使用装饰器模式来扩展，而且有了装饰工厂之后，我们还可以快速批量修改。

## 适配器模式

适配器想必大家都用过，我家里的老显卡只有HDMI接口，但是显示器是DP接口，这两个插不上，怎么办呢？答案就是买个适配器，将DP接口转换为HDMI的就行了。这里的适配器模式原理类似，当我们面临接口不通用，接口参数不匹配等情况，我们可以在他外面再包一个方法，这个方法接收我们现在的名字和参数，里面调用老方法传入以前的参数形式。

### 基本结构

适配器模式的基本结构就是下面这样，假设我们要用的打log的函数叫`mylog`，但是具体方法我们又想调用现成的`window.console.log`实现，那我们就可以给他包一层。

```javascript
var mylog = (function(){
  return window.console.log;
})()
```

如果觉得上面的结构太简单了，仍然不知道怎么运用，我们下面再通过一个例子来看下。

### 实例：框架变更了

假如我们现在面临的一个问题是公司以前一直使用的A框架，但是现在决定换成jQuery了，这两个框架大部分接口是兼容的，但是部分接口不适配，我们需要解决这个问题。

```javascript
// 一个修改css的接口
$.css();      // jQuery叫css
A.style();    // A框架叫style

// 一个绑定事件的接口
$.on();       // jQuery叫on
A.bind();     // A框架叫bind
```

当然我们全局搜索把使用的地方改掉也行，但是如果使用适配器修改可能更优雅:

```javascript
// 直接把以前用的A替换成$
window.A = $;

// 适配A.style
A.style = function() {
  return $.css.apply(this, arguments);    // 保持this不变
}

// 适配A.bind
A.bind = function() {
  return $.on.apply(this, arguments);
}
```

适配器就是这么简单，接口不一样，包一层改成一样就行了。

### 实例：参数适配

适配器模式不仅仅可以像上面那样来适配接口不一致的情况，还可以用来适配参数的多样性。假如我们的一个方法需要接收一个很复杂的对象参数，比如webpack的配置，可能有很多选项，但是用户可能只用到部分，或者用户可能传入不支持的配置，那我们需要一个将用户传入的配置适配到标准配置的过程，这个做起来其实也很简单：

```javascript
// func方法接收一个很复杂的config
function func(config) {
  var defaultConfig = {
    name: 'hong',
    color: 'red',
    // ......
  };
  
  // 为了将用户的配置适配到标准配置，我们直接循环defaultConfig
  // 如果用户传入了配置，就用用户的，如果没传就用默认的
  for(var item in defaultConfig) {
    defaultConfig[item] = config[item] || defaultConfig[item];
  }
}
```

## 访问者模式

定义一个访问者，访问者作为中介来访问数据，请求者不直接访问数据，而是通过访问者间接来访问数据。

### 实例：不同角色访问数据

```javascript
// 报表数据
function report() {
  this.cost = 10;
  this.income = 20;
  this.profit = 10;
}

// 角色：老板,只关心利润
function boss() {}
boss.prototype.get = function(profit){}

// 角色：财务，只关心收入和支出
function account() {}
account.prototype.get = function(num1, num2){}

// 中介访问者
function vistor(data, man) {
  var handers = {
    boss: function(data) {
      man.get(data.profit);
    },
    boss: function(data) {
      man.get(data.income, data.cost);
    },
  }
  
  return handers[man.constructor.name];
}

// 老板要看报表了
vistor(new report(), new boss());
// 财务要看报表了
vistor(new report(), new account());
```

有时候我们需要用现有方法，但是现有方法与需求不太吻合，需要进行部分修改，但是改原方法影响面又太大，我们就可以考虑使用下列两种设计模式，`适配器模式`和`装饰器模式`。

## 命令模式

前面两种模式可以让我们在不修改原方法的情况下将它用于当前特异性的需求，保证了以前代码不受影响，也相当于扩展了原来方法的适用范围。这里再来讲一种可以解耦实现和调用的设计模式----命令模式，这种模式可以在实现或者调用单个变化时不影响另一个，一般适用于调用方式可能会变化的情况。

目的：解耦实现和调用，让双方互不干扰

应用场景：调用的命令充满不确定性

### 基本结构

命令模式的一般结构是一个自执行方法里面返回一个`execute`方法，这个`execute`可以访问到`action`对象，这个对象才是真正执行功能的地方，`execute`根据传入的命令调用对应的`action`。

```javascript
var commander = (function(){
  var action = {
    
  };
  
  return function execute(command){}
})(command)
```

### 实例：绘图命令

这个例子讲的是封装一系列的canvas绘图命令，常规的代码我们可以这样写：

```javascript
var myCanvas = function() {
  
}
myCanvas.prototype.drawCircle = function() {}
myCanvas.prototype.drawRect = function() {}

// 使用时
var mycanvas = new myCanvas();
mycanvas.drawCircle();
mycanvas.drawRect();
```

上述代码，外部调用画画是直接调用了`myCanvas`里面的API，这样外面的调用和里面的实现时是强耦合的，如果里面的方法名变了，外部调用的地方都需要修改。为了解除这种强耦合，我们可以使用命令模式来包装下。

```javascript
var canvasCommander = (function(){
  var action = {
    drawCircle: function() {},
    drawRect: function() {},
  };
  
  return function execute(commands){
    commands.forEach((item) => {
      action[item.command](item.config);
    });
  }
})(commands)

// 上面的canvasCommander参数接收一个数组，使用时就是这样
canvasCommander([
  {command: 'drawCircle', config: {}},
  {command: 'drawRect', config: {}}
]);
```

## 总结

1. 扩展性的核心其实就是高内聚，低耦合，各个模块都专注在自己的功能，尽量减少对外部的直接依赖。
2. 职责链模式和观察者模式主要是用来降低模块间耦合的，耦合低了就可以很方便的对他们进行组织，给他们扩展功能，适配器模式和装饰器模式主要是用来在不影响原有代码的基础上进行扩展的。
3. 如果我们需要对某个对象进行一系列的操作，这些操作可以组织成一个链条，那我们可以考虑使用职责链模式。链条上的具体任务不需要知道其他任务的存在，只专注自己的工作，消息的传递由链条负责。使用了职责链模式，链条上的任务可以很方便的增加，删除或者重新组织成新的链条，就像一个流水线一样。
4. 如果我们有两个对象在不确定的时间点需要异步通讯，我们可以考虑使用观察者模式，使用者不需要一直关注其他特定的对象，他只要在消息中心注册一个消息，当这个消息出现时，消息中心会负责来通知他。
5. 如果我们已经拿到了一些旧代码，但是这些旧代码不能满足我们的需求，我们又不能随意更改他，我们可以考虑使用装饰器模式来增强他的功能。
6. 对于旧代码改造或者新模块引入，我们可能面临接口不通用的情况，这时候我们可以考虑写一个适配器来适配他们。适配器模式同样适用于参数适配的情况。
7. 还是那句话，设计模式更注重的是思想，不用生搬硬套代码模板。也不要在所有地方硬套设计模式，而是在真正需要的时候使用他来增加我们代码的可扩展性。
8. 访问者模式其实是加了一个访问者中介，数据的请求者不直接请求数据，而是通过中介来请求，让请求者和数据脱耦。
9. 命令模式是通过命令来调用具体的方法，调用者不直接调用具体的方法，而是只发出命令，让调用者和具体实现脱耦。

本文是设计模式的第三篇文章，主要讲提高扩展性的设计模式，前两篇是：

[（480赞！）不知道怎么封装代码？看看这几种设计模式吧！](https://juejin.im/post/5ec737b36fb9a04799583002)

[不知道怎么提高代码复用性？看看这几种设计模式吧](https://juejin.im/post/5ecb67846fb9a047b534a346)

后面还有一篇`提高代码质量`的设计模式。

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**本文素材来自于[网易高级前端开发工程师微专业](https://mooc.study.163.com/smartSpec/detail/1202851605.htm)唐磊老师的设计模式课程。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**