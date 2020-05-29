### flat函数 - 数组扁平化

考虑我们有如下一个数组

```javascript
const arr = [1, 2, [3, 4], [5, 6, [7, 8]]]
```

这个数组有很多层，我们现在需要将它变成一层的应该怎么做呢？结合我们前面讲过的`reduce`和递归我们很容易写出这个方法：

```javascript
const flat = (arr, initVal) => {
  const startVal = initVal || [];
  return arr.reduce((prevRes, item) => {
    // 如果里层还是数组，递归调用自身
    if(Array.isArray(item)){
      return flat(item, prevRes);
    }else{
      return prevRes.concat(item);
    }
  }, startVal)
}

const arr = [1, 2, [3, 4], [5, 6, [7, 8]]];
const flatArr = flat(arr);

console.log(flatArr); // [1, 2, 3, 4, 5, 6, 7, 8]
```

如果我们想对递归的层数进行限制，我们可以再加一个参数来进行控制：

```javascript
const flat = (arr, depth, initVal) => {
  const startVal = initVal || [];
  return arr.reduce((prevRes, item) => {
    // 如果里层还是数组，递归调用自身
    if(Array.isArray(item) && depth > 1){
      return flat(item, depth - 1, prevRes);
    }else{
      return prevRes.concat(item);
    }
  }, startVal)
}

const arr = [1, 2, [3, 4], [5, 6, [7, 8]]];
const flatArr = flat(arr, 1); // 只扁平化一层

console.log(flatArr);
```

### 缓存函数

有时候一个复杂的计算函数需要反复运行，如果每次都对他进行计算，会浪费大量性能，我们可以用一个记忆函数来缓存计算过的值，比较典型的就是斐波拉契数列：

```javascript
const fibonacci = (x) => {
  if(x === 1 || x === 2){
    return 1;
  }
  
  return fibonacci(x - 1) + fibonacci(x - 2);
}
```

我们看下计算第40个数需要的时间：

```javascript
const startTime = new Date().getTime();
fibonacci(40);
const needTime = new Date().getTime() - startTime;

console.log(needTime); // 959毫秒
```

由于每次调`fibonacci`的计算过程都是一样的，所以每次用时也是一样，但算过一次后，其中很多数字我们已经计算过一次了，没有必要进行重复计算，我们可以用一个记忆方法来记住以前的结果，下次需要用的时候直接取出结果就好了：

```javascript
// 第一个参数是需要缓存的函数，第二个参数是用来生成缓存key的方法，如果不传就用第一个参数做key
const memo = function(fn, hasher) {
  const memoFun = function(){
    const cache = memoFun.cache;
    const args = [].slice.apply(arguments);
    const hashKey = hasher ? hasher.apply(this, arguments) : args[0];
    if(!cache[hashKey]){
      cache[hashKey] = fn.apply(this, arguments);
    }
    
    return cache[hashKey];
  }
  
  memoFun.cache = {};
  return memoFun;
}
```

然后我们用`memo`方法包装一下`fibonacci`，让他具有缓存功能：

```javascript
const cachedfFibonacci = memo(fibonacci);

// 然后看下效果
let startTime = new Date().getTime();
cachedfFibonacci(40);
let needTime = new Date().getTime() - startTime;

console.log(needTime); // 第一次运行时间还是959毫秒

// 再调一次
startTime = new Date().getTime();
cachedfFibonacci(40);
needTime = new Date().getTime() - startTime;

console.log(needTime); // 时间直接变为0了，直接取缓存，快到1毫秒都不要
```

### 柯里化函数

柯里化就是将一个接收多个参数的函数转化为一系列使用一个参数的函数的技术。实现的效果就是

```javascript
const fun = (a, b, c) => {return [a, b, c]};

//上述函数经过科里化后就是
const curriedFun = curry(fun);
// curriedFun的调用变为 curriedFun(a)(b)(c)
```

下面我们来看看`curry`函数应该怎么实现

```javascript
// 观察上诉柯里化调用发现，它其实就是把参数都搜集起来了，每次调用搜集几个参数
// 当搜集的参数足够时执行主方法
const curry = (fn) => {
  // 先记录主方法原始的参数个数，fn.length就是函数接收的参数个数
  const parmasLength = fn.length;
  
  return executeFun = (...args) => {
    // 如果接收参数够了，执行主方法
    if(args.length >= parmasLength) {
      return fn(...args);
    } else {
      // 如果参数不够，继续接收参数
      return (...args2) => {
        // 注意executeFun接收的参数是平铺的，需要将数组解构
        return executeFun(...args.concat(args2));
      }
    }
  }
}

// 现在看下结果
curriedFun(1)(2)(3); // [1, 2, 3]
curriedFun(1, 2)(3); // [1, 2, 3]
curriedFun(1, 2, 3); // [1, 2, 3]
```



### 防抖函数

我们有一个需求：实现一个搜索框，当用户连续输入的时候不发请求去搜索，只有当用户输入暂停超过500毫秒才发请求。实现这个需求就需要我们的防抖函数了，因为是等待500毫秒才发起请求，我们很容易就想到了`setTimeout`，如果timer存在，又触发了这个方法，就把timer清了继续等，知道方法不再触发，timer执行

```javascript
// 发起请求的函数
const sendRequest = () => {};

// 防抖函数
const debounse = (fn, waitTime) => {
  let timer = null;
  
  return function() {
    const self = this;
    const args = [].slice.apply(arguments);
    if(timer){
      clearTimeout(timer);
    } else {
      timer = setTimeout(() => {
        fn.apply(self, args);
      }, waitTime);
    }
  }
}

const debounsedSendRequest = debounse(sendRequest, 500);
```

### 节流函数

节流函数和防抖函数很像，但是针对的需求不一样，比如`onScorll`方法可能会触发的很频繁，我们不能每次触发的时候都去调回调，会浪费大量性能，我们可能需要每50ms调用一次，那就需要节流函数了：

```javascript
const scrollHandler = () => {};

const throttle = (fn, waitTime) => {
  let isRunnig = false;
  return (...args) => {
    if(!isRunnig) {
      isRunnig = true;
      setTimeout(() => {
        fn(...args);
        isRunnig = false;
      }, waitTime)
    }
  }
}

const throttledScrollHandler = throttle(scrollHandler, 50);
```

