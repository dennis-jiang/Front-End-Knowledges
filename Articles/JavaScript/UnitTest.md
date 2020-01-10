### 单元测试及原理

单元测试是指对软件中的最小可测试单元进行检查和验证，通过单元测试可以检测出潜在的bug，还可以快速反馈功能输出，验证代码是否达到预期，也可以保证代码重构的安全性。

有这样一个方法：

```javascript
let add = (a, b) => a + b;
```

这是一个很简单的计算两个数的和的方法，假如我们想看看他的逻辑对不对，我们可以调用一下，然后跟我们预期的一个值比较下，如果不符合就抛出一个错误：

```javascript
let add = (a, b) => a + b;
let result = add(1, 2);
let expect = 3;
if(result !== expect){
  throw new Error(`1+2应该等于${expect},实际等于${result}`)
}
```

这其实就是单元测试的原理，但是这里写的方法太直白，而且不能复用，让我们改造下`expect`，把它变成一个通用方法：

```javascript
const expect = (res) => {
  return {
    toBe: (expectRes) => {
      if(res !== expectRes){
        throw new Error(`期望值是${expectRes}，但实际上却是${res}!`)
      }
    }
  }
}
```

我们前面期望`1+2=3`，这其实就是一个单元测试用例，当我们有多个用例的话，我们可以用一种更通用优雅的方式来写用例，我们来写一个通用用例方法：

```javascript
const test = (desc, fn) => {
  try{
    fn();
    console.log(`${desc} -> PASS`)
  }catch(e){
    console.error(`${desc} -> FAIL`, e);
  }
}
```



我们用这两个通用方法来改写下我们的单元测试：

```javascript
let add = (a, b) => a + b;

const expect = (res) => {
  return {
    toBe: (expectRes) => {
      if(res !== expectRes){
        throw new Error(`期望值是${expectRes}，但实际上却是${res}!`)
      }
    }
  }
}

const test = (desc, fn) => {
  try{
    fn();
    console.log(`${desc} -> PASS`)
  }catch(e){
    console.error(`${desc} -> FAIL`, e);
  }
}

test('1+2=3', () => {
  expect(add(1,2)).toBe(3); // 1+2=3 -> PASS
});

test('1+2=4', () => {
  expect(add(1,2)).toBe(4); // 1+2=4 -> FAIL Error: 期望值是4，但实际上却是3!
});
```

上面介绍的是单元测试的原理，事实上在我们写单元测试的时候并不需要自己写`expect`和`test`共用方法，需要用到的比对方法也远远不止`toBe`一个。我们可以直接用第三方库[Jest](https://jestjs.io/)，他包含了几乎所有我们需要的工具，使用方法官网都有，这里主要讲原理，使用方法不再赘述。