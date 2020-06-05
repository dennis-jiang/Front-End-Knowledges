## 提高代码质量的目的

程序猿的本职工作就是写代码，写出高质量的代码应该是我们的追求和对自己的要求，因为：

> 1. 高质量的代码往往意味着更少的BUG，更好的模块化，是我们扩展性，复用性的基础
> 2. 高质量的代码也意味着更好的书写，更好的命名，有利于我们的维护

## 什么代码算好的质量

怎样来定义代码质量的"好"，业界有很多标准，本文认为好的代码应该有以下特点：

> 1. 代码整洁，比如缩进之类的，现在有很多工具可以自动解决这个问题，比如eslint。
> 2. 结构规整，没有漫长的结构，函数拆分合理，不会来一个几千行的函数，也不会有几十个`if...else`。这要求写代码的人有一些优化的经验，本文会介绍几种模式来优化这些情况。
> 3. 阅读起来好理解，不会出现一堆`a,b,c`这种命名，而是应该尽量语义化，变量名和函数名都尽量有意义，最好是代码即注释，让别人看你的代码就知道你在干嘛。

本文介绍的设计模式主要有`策略/状态模式`，`外观模式`，`迭代器模式`，`备忘录模式`。

## 策略/状态模式

### 策略模式基本结构

假如我们需要做一个计算器，需要支持加减乘除，为了判断用户具体需要进行哪个操作，我们需要4个`if...else`来进行判断，如果支持更多操作，那`if...else`会更长，不利于阅读，看着也不优雅。所以我们可以用策略模式优化如下：

```javascript
function calculator(type, a, b) {
  const strategy = {
    add: function(a, b) {
      return a + b;
    },
    minus: function(a, b) {
      return a - b;
    },
    division: function(a, b) {
      return a / b;
    },
    times: function(a, b) {
      return a * b;
    }
  }
  
  return strategy[type](a, b);
}

// 使用时
calculator('add', 1, 1);
```

上述代码我们用一个对象取代了多个`if...else`，我们需要的操作都对应这个对象里面的一个属性，这个属性名字对应我们传入的`type`，我们直接用这个属性名字就可以获取对应的操作。

### 状态模式基本结构

状态模式和策略模式很像，也是有一个对象存储一些策略，但是还有一个变量来存储当前的状态，我们根据当前状态来获取具体的操作：

```javascript
function stateFactor(state) {
  const stateObj = {
    status: '',
    state: {
      state1: function(){},
      state2: function(){},
    },
    run: function() {
      return this.state[this.status];
    }
  }
  
  stateObj.status = state;
  return stateObj;
}

// 使用时
stateFactor('state1').run();
```

`if...else`其实是根据不同的条件来改变代码的行为，而策略模式和状态模式都可以根据传入的策略或者状态的不同来改变行为，所有我们可以用这两种模式来替代`if...else`。

### 实例：访问权限

这个例子的需求是我们的页面需要根据不同的角色来渲染不同的内容，如果我们用`if...else`写就是这样:

```javascript
// 有三个模块需要显示，不同角色看到的模块应该不同
function showPart1() {}
function showPart2() {}
function showPart3() {}

// 获取当前用户的角色，然后决定显示哪些部分
axios.get('xxx').then((role) => {
  if(role === 'boss'){
    showPart1();
    showPart2();
    showPart3();
  } else if(role === 'manager') {
    showPart1();
    showPart2();
  } else if(role === 'staff') {
    showPart3();
  }
});
```

上述代码中我们通过API请求获得了当前用户的角色，然后一堆`if...else`去判断应该显示哪些模块，如果角色很多，这里的`if...else`就可能很长，我们可以尝试用状态模式优化下：

```javascript
// 先把各种角色都包装到一个ShowController类里面
function ShowController() {
  this.role = '';
  this.roleMap = {
    boss: function() {
      showPart1();
      showPart2();
      showPart3();
    },
    manager: function() {
      showPart1();
    	showPart2();
    },
    staff: function() {
      showPart3();
    }
  }
}

// ShowController上添加一个实例方法show，用来根据角色展示不同的内容
ShowController.prototype.show = function() {
  axios.get('xxx').then((role) => {
    this.role = role;
    this.roleMap[this.role]();
  });
}

// 使用时
new ShowController().show();
```

上述代码我们通过一个状态模式改写了访问权限模块，去掉了`if...else`，而且不同角色的展示都封装到了`roleMap`里面，后面要增加或者减少都会方便很多。

### 实例：复合运动

这个例子的需求是我们现在有一个小球，我们需要控制他移动，他移动的方向可以是上下左右，还可以是左上，右下之类的复合运动。如果我们也用`if...else`来写，这头都会写大：

```javascript
// 先来四个方向的基本运动
function moveUp() {}
function moveDown() {}
function moveLeft() {}
function moveRight() {}

// 具体移动的方法，可以接收一个或两个参数，一个就是基本操作，两个参数就是左上，右下这类操作
function move(...args) {
  if(args.length === 1) {
    if(args[0] === 'up') {
      moveUp();
    } else if(args[0] === 'down') {
      moveDown();        
    } else if(args[0] === 'left') {
      moveLeft();        
    } else if(args[0] === 'right') {
      moveRight();        
    }
  } else {
    if(args[0] === 'left' && args[1] === 'up') {
      moveLeft();
      moveUp();
    } else if(args[0] === 'right' && args[1] === 'down') {
      moveRight();
      moveDown();
    }
    // 后面还有很多if...
  }
}
```

可以看到这里`if...else`看得我们头都大了，还是用策略模式来优化下吧：

```javascript
// 建一个移动控制类
function MoveController() {
  this.status = [];
  this.moveHanders = {
    // 写上每个指令对应的方法
    up: moveUp,
    dowm: moveDown,
    left: moveLeft,
    right: moveRight
  }
}

// MoveController添加一个实例方法来触发运动
MoveController.prototype.run = function(...args) {
  this.status = args;
  this.status.forEach((move) => {
    this.moveHanders[move]();
  });
}

// 使用时
new MoveController().run('left', 'up')
```

上述代码我们也是将所有的策略都封装到了`moveHanders`里面，然后通过实例方法`run`传入的方法来执行具体的策略。

## 外观模式

### 基本结构

当我们设计一个模块时，里面的方法可以会设计得比较细，但是暴露给外面使用的时候，不一定非得直接暴露这些细小的接口，外部使用者需要的可能是组合部分接口来实现某个功能，我们暴露的时候其实就可以将这个组织好。这就像餐厅里面的菜单，有很多菜，用户可以一个一个菜去点，也可以直接点一个套餐，外观模式提供的就类似于这样一个组织好的套餐：

```javascript
function model1() {}

function model2() {}

// 可以提供一个更高阶的接口，组合好了model1和model2给外部使用
function use() {
  model2(model1());
}
```

### 实例：常见的接口封装

外观模式说起来其实非常常见，很多模块内部都很复杂，但是对外的接口可能都是一两个，我们无需知道复杂的内部细节，只需要调用统一的高级接口就行，比如下面的选项卡模块:

```javascript
// 一个选项卡类，他内部可能有多个子模块
function Tab() {}

Tab.prototype.renderHTML = function() {}    // 渲染页面的子模块
Tab.prototype.bindEvent = function() {}    // 绑定事件的子模块
Tab.prototype.loadCss = function() {}    // 加载样式的子模块

// 对外不需要暴露上面那些具体的子模块，只需要一个高级接口就行
Tab.prototype.init = function(config) {
  this.loadCss();
  this.renderHTML();
  this.bindEvent();
}
```

上述代码这种封装模式非常常见，其实也是用到了外观模式，他当然也可以暴露具体的`renderHTML`，`bindEvent`，`loadCss`这些子模块，但是外部使用者可能并不关心这些细节，只需要给一个统一的高级接口就行，就相当于改变了外观暴露出来，所以叫`外观模式`。

### 实例：方法的封装

这个例子也很常见，就是把一些类似的功能封装成一个方法，而不是每个地方去写一遍。在以前还是IE主导天下的时候，我们需要做很多兼容的工作，仅仅是一个绑定事件就有`addEventListener`，`attachEvent`,`onclick`等，为了避免每次都进行这些检测，我们可以将他们封装成一个方法：

```javascript
function addEvent(dom, type, fn) {
  if(dom.addEventListener) {
    return dom.addEventListener(type, fn, false);
  } else if(dom.attachEvent) {
    return dom.attachEvent("on" + type, fn);
  } else {
    dom["on" + type] = fn;
  }
}
```

然后将`addEvent`暴露出去给外面使用，其实我们在实际编码时经常这样封装方法，只是我们自己可能没意识到这个是外观模式。

## 迭代器模式

### 基本结构

迭代器模式模式在JS里面很常见了，数组自带的`forEach`就是迭代器模式的一个应用，我们也可以实现一个类似的功能：

```javascript
function Iterator(items) {
  this.items = items;
}

Iterator.prototype.dealEach = function(fn) {
  for(let i = 0; i < this.items.length; i++) {
    fn(this.items[i], i);
  }
}
```

上述代码我们新建了一个迭代器类，构造函数接收一个数组，实例方法`dealEach`可以接收一个回调，对实例上的`items`每一项都执行这个回调。

### 实例：数据迭代器

其实JS数组很多原生方法都用了迭代器模式，比如`find`，`find`接收一个测试函数，返回符合这个测试函数的第一个数据。这个例子要做的是扩展这个功能，返回所有符合这个测试函数的数据项，而且也可以接收两个参数，第一个参数是属性名，第二个参数是值，同样返回所有该属性与值匹配的项：

```javascript
// 外层用一个工厂模式封装下，调用时不用写new
function iteratorFactory(data) {
  function Iterator(data) {
    this.data = data;
  }
  
  Iterator.prototype.findAll = function(handler, value) {
    const result = [];
    let handlerFn;
    // 处理参数，如果第一个参数是函数，直接拿来用
    // 如果不是函数，就是属性名，给一个对比的默认函数
    if(typeof handler === 'function') {
      handlerFn = handler;
    } else {
      handlerFn = function(item) {
        if(item[handler] === value) {
          return true;
        }
        
        return false;
      }
    }
    
    // 循环数据里面的每一项，将符合结果的塞入结果数组
    for(let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      const res = handlerFn(item);
      if(res) {
        result.push(item)
      }
    }
    
    return result;
  }
  
  return new Iterator(data);
}

// 写个数据测试下
const data = [{num: 1}, {num: 2}, {num: 3}];
iteratorFactory(data).findAll('num', 2);    // [{num: 2}]
iteratorFactory(data).findAll(item => item.num >= 2); // [{num: 2}, {num: 3}]
```

上述代码封装了一个类似数组`find`的迭代器，扩展了他的功能，这种迭代器非常适合用来处理API返回的大量结构相似的数据。

## 备忘录模式

### 基本结构

备忘录模式类似于JS经常使用的缓存函数，内部记录一个状态，也就是缓存，当我们再次访问的时候可以直接拿缓存数据:

```javascript
function memo() {
  const cache = {};
  
  return function(arg) {
    if(cache[arg]) {
      return cache[arg];
    } else {
      // 没缓存的时候先执行方法，得到结果res
      // 然后将res写入缓存
      cache[arg] = res;
      return res;
    }
}
```

### 实例：文章缓存

这个例子在实际项目中也比较常见，用户每次点进一个新文章都需要从API请求数据，如果他下次再点进同一篇文章，我们可能希望直接用上次请求的数据，而不再次请求，这时候就可以用到我们的备忘录模式了，直接拿上面的结构来用就行了：

```javascript
function pageCache(pageId) {
  const cache = {};
  
  return function(pageId) {
    // 为了保持返回类型一致，我们都返回一个Promise
    if(cache[pageId]) {
      return Promise.solve(cache[pageId]);
    } else {
      return axios.get(pageId).then((data) => {
        cache[pageId] = data;
        return data;
      })
    }
  }
}
```

上述代码用了备忘录模式来解决这个问题，但是代码比较简单，实际项目中可能需求会更加复杂一些，但是这个思路还是可以参考的。

### 实例：前进后退功能

这个例子的需求是，我们需要做一个可以移动的DIV，用户把这个DIV随意移动，但是他有时候可能误操作或者反悔了，想把这个DIV移动回去，也就是将状态回退到上一次，有了回退状态的需求，当然还有配对的前进状态的需求。这种类似的需求我们就可以用备忘录模式实现:

```javascript
function moveDiv() {
  this.states = [];       // 一个数组记录所有状态
  this.currentState = 0;  // 一个变量记录当前状态位置
}

// 移动方法，每次移动记录状态
moveDiv.prototype.move = function(type, num) {
  changeDiv(type, num);       // 伪代码，移动DIV的具体操作，这里并未实现
  
  // 记录本次操作到states里面去
  this.states.push({type,num});
  this.currentState = this.states.length - 1;   // 改变当前状态指针
}

// 前进方法，取出状态执行
moveDiv.prototype.forward = function() {
  // 如果当前不是最后一个状态
  if(this.currentState < this.states.length - 1) {
    // 取出前进的状态
    this.currentState++;
    const state = this.states[this.currentState];
    
    // 执行该状态位置
    changeDiv(state.type, state.num);
  }
}

// 后退方法是类似的
moveDiv.prototype.back = function() {
  // 如果当前不是第一个状态
  if(this.currentState > 0) {
    // 取出后退的状态
    this.currentState--;
    const state = this.states[this.currentState];
    
    // 执行该状态位置
    changeDiv(state.type, state.num);
  }
}
```

上述代码通过一个数组将用户所有操作过的状态都记录下来了，用户可以随时在状态间进行前进和后退。

## 总结

本文讲的这几种设计模式`策略/状态模式`，`外观模式`，`迭代器模式`，`备忘录模式`都很好理解，而且在实际工作中也非常常见，熟练使用他们可以有效减少冗余代码，提高我们的代码质量。

1. `策略模式`通过将我们的`if`条件改写为一条条的策略减少了`if...else`的数量，看起来更清爽，扩展起来也更方便。`状态模式`跟`策略模式`很像，只是还多了一个状态，可以根据这个状态来选取具体的策略。
2. `外观模式`可能我们已经在无意间使用了，就是将模块一些内部逻辑封装在一个更高级的接口内部，或者将一些类似操作封装在一个方法内部，从而让外部调用更加方便。
3. `迭代器模式`在JS数组上有很多实现，我们也可以模仿他们做一下数据处理的工作，特别适合处理从API拿来的大量结构相似的数据。
4. `备忘录模式`就是加一个缓存对象，用来记录之前获取过的数据或者操作的状态，后面可以用来加快访问速度或者进行状态回滚。
5. 还是那句话，设计模式的重点在于理解思想，实现方式可以多种多样。

本文是讲设计模式的最后一篇文章，前面三篇是:

[（500+赞！）不知道怎么封装代码？看看这几种设计模式吧！](https://juejin.im/post/5ec737b36fb9a04799583002)

[（100+赞！)框架源码中用来提高扩展性的设计模式](https://juejin.im/post/5ed0a2286fb9a047e02ef121)

[不知道怎么提高代码复用性？看看这几种设计模式吧](https://juejin.im/post/5ecb67846fb9a047b534a346)

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**本文素材来自于[网易高级前端开发工程师微专业](https://mooc.study.163.com/smartSpec/detail/1202851605.htm)唐磊老师的设计模式课程。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

