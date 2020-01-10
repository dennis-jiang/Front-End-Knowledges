### compose函数

compose函数可以将需要嵌套执行的函数平铺，嵌套执行就是一个函数的返回值将作为另一个函数的参数。我们考虑一个简单的需求：

```
给定一个输入值x，先给这个值加10，然后结果乘以10
```

这个需求很简单，直接一个计算函数就行：

```javascript
const calculate = x => (x + 10) * 10;
let res = calculate(10);
console.log(res);    // 200
```

但是根据我们之前讲的函数式编程，我们可以将复杂的几个步骤拆成几个简单的可复用的简单步骤，于是我们拆出了一个加法函数和一个乘法函数:

```javascript
const add = x => x + 10;
const multiply = x => x * 10;

// 我们的计算改为两个函数的嵌套计算，add函数的返回值作为multiply函数的参数
let res = multiply(add(10));
console.log(res);    // 结果还是200
```

上面的计算方法就是函数的嵌套执行，而我们`compose`的作用就是将嵌套执行的方法作为参数平铺，嵌套执行的时候，里面的方法也就是右边的方法最开始执行，然后往左边返回，我们的`compose`方法也是从右边的参数开始执行，所以我们的目标就很明确了，我们需要一个像这样的`compose`方法：

```javascript
// 参数从右往左执行，所以multiply在前，add在后
let res = compose(multiply, add)(10);
```

那这个compose方法要怎么实现呢，这里需要借助`Array.prototype.reduce`，这个方法会从左往右迭代，但是我们需要的是从右往左迭代，这个方法是`Array.prototype.reduceRight`:

```javascript
const compose = function(){
  // 将接收的参数存到一个数组， args == [multiply, add]
  const args = [].slice.apply(arguments);
  return function(x) {
    return args.reduceRight((res, cb) => cb(res), x);
  }
}

// 我们来验证下这个方法
let calculate = compose(multiply, add);
let res = calculate(10);
console.log(res);    // 结果还是200
```

上面的`compose`函数使用ES6的话会更加简洁：

```javascript
const compose = (...args) => x => args.reduceRight((res, cb) => cb(res), x);
```

Redux的中间件就是用`compose`实现的，webpack中loader的加载顺序也是从右往左，这是因为他也是`compose`实现的。

### pipe函数

`pipe`函数跟`compose`函数的左右是一样的，也是将参数平铺，只不过他的顺序是**从左往右**。我们来实现下，只需要将`reduceRight`改成`reduce`就行了：

```javascript
const pipe = function(){
  const args = [].slice.apply(arguments);
  return function(x) {
    return args.reduce((res, cb) => cb(res), x);
  }
}

// 参数顺序改为从左往右
let calculate = pipe(add, multiply);
let res = calculate(10);
console.log(res);    // 结果还是200
```

ES6写法：

```javascript
const pipe = (...args) => x => args.reduce((res, cb) => cb(res), x)
```



