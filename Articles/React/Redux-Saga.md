[上一篇文章我们分析了`Redux-Thunk`的源码](https://juejin.im/post/6869950884231675912)，可以看到他的代码非常简单，只是让`dispatch`可以处理函数类型的`action`，其作者也承认对于复杂场景，`Redux-Thunk`并不适用，还推荐了`Redux-Saga`来处理复杂副作用。本文要讲的就是`Redux-Saga`，这个也是我在实际工作中使用最多的`Redux`异步解决方案。`Redux-Saga`比`Redux-Thunk`复杂得多，而且他整个异步流程都使用`Generator`来处理，`Generator`也是我们这篇文章的前置知识，[如果你对`Generator`还不熟悉，可以看看这篇文章](https://juejin.im/post/6844904133577670664)。

本文仍然是老套路，先来一个`Redux-Saga`的简单例子，然后我们自己写一个`Redux-Saga`来替代他，也就是源码分析。

本文可运行的代码已经上传到GitHub，可以拿下来玩玩：[https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/React/redux-saga](https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/React/redux-saga)

## 简单例子

网络请求是我们经常需要处理的异步操作，假设我们现在的一个简单需求就是点击一个按钮去请求用户的信息，大概长这样：

![Sep-11-2020 16-31-55](../../images/React/Redux-Saga/Sep-11-2020 16-31-55.gif)

这个需求使用`Redux`实现起来也很简单，点击按钮的时候`dispatch`出一个`action`。这个`action`会触发一个请求，请求返回的数据拿来显示在页面上就行：

```javascript
import React from 'react';
import { connect } from 'react-redux';

function App(props) {
  const { dispatch, userInfo } = props;

  const getUserInfo = () => {
    dispatch({ type: 'FETCH_USER_INFO' })
  }

  return (
    <div className="App">
      <button onClick={getUserInfo}>Get User Info</button>
      <br></br>
      {userInfo && JSON.stringify(userInfo)}
    </div>
  );
}

const matStateToProps = (state) => ({
  userInfo: state.userInfo
})

export default connect(matStateToProps)(App);
```

[上面这种写法都是我们之前讲`Redux`就介绍过的](https://juejin.im/post/6847902222756347911)，`Redux-Saga`介入的地方是`dispatch({ type: 'FETCH_USER_INFO' })`之后。按照`Redux`一般的流程，`FETCH_USER_INFO`被发出后应该进入`reducer`处理，但是`reducer`都是同步代码，并不适合发起网络请求，所以我们可以使用`Redux-Saga`来捕获`FETCH_USER_INFO`并处理。

`Redux-Saga`是一个`Redux`中间件，所以我们在`createStore`的时候将它引入就行：

```javascript
// store.js

import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import reducer from './reducer';
import rootSaga from './saga';

const sagaMiddleware = createSagaMiddleware()

let store = createStore(reducer, applyMiddleware(sagaMiddleware));

// 注意这里，sagaMiddleware作为中间件放入Redux后
// 还需要手动启动他来运行rootSaga
sagaMiddleware.run(rootSaga);

export default store;
```

注意上面代码里的这一行：

```javascript
sagaMiddleware.run(rootSaga);
```

`sagaMiddleware.run`是用来手动启动`rootSaga`的，我们来看看`rootSaga`是怎么写的：

```javascript
import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchUserInfoAPI } from './api';

function* fetchUserInfo() {
  try {
    const user = yield call(fetchUserInfoAPI);
    yield put({ type: "FETCH_USER_SUCCEEDED", payload: user });
  } catch (e) {
    yield put({ type: "FETCH_USER_FAILED", payload: e.message });
  }
}

function* rootSaga() {
  yield takeEvery("FETCH_USER_INFO", fetchUserInfo);
}

export default rootSaga;
```

上面的代码我们从`export`开始看吧，`export`的东西是`rootSaga`这个`Generator`函数，这里面就一行:

```javascript
yield takeEvery("FETCH_USER_INFO", fetchUserInfo);
```

这一行代码用到了`Redux-Saga`的一个`effect`，也就是`takeEvery`，他的作用是监听**每个**`FETCH_USER_INFO`,当`FETCH_USER_INFO`出现的时候，就调用`fetchUserInfo`函数，注意这里是**每个**`FETCH_USER_INFO`。也就是说如果同时发出多个`FETCH_USER_INFO`，我们每个都会响应并发起请求。类似的还有`takeLatest`，`takeLatest`从名字都可以看出来，是响应最后一个请求，具体使用哪一个，要看具体的需求。

然后看看`fetchUserInfo`函数，这个函数也不复杂，就是调用一个`API`函数`fetchUserInfoAPI`去获取数据，注意我们这里函数调用并不是直接的`fetchUserInfoAPI()`，而是使用了`Redux-Saga`的`call`这个`effect`，这样做可以让我们写单元测试变得更简单，我们后面讲源码的时候再来仔细看看。获取数据后，我们调用了`put`去发出`FETCH_USER_SUCCEEDED`这个`action`，这里的`put`类似于`Redux`里面的`dispatch`，也是用来发出`action`的。这样我们的`reducer`就可以拿到`FETCH_USER_SUCCEEDED`进行处理了，跟以前的`reducer`并没有太大区别。

```javascript
// reducer.js

const initState = {
  userInfo: null,
  error: ''
};

function reducer(state = initState, action) {
  switch (action.type) {
    case 'FETCH_USER_SUCCEEDED':
      return { ...state, userInfo: action.payload };
    case 'FETCH_USER_FAILED':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export default reducer;
```

通过这个例子的代码结构我们可以看出：

> 1. `action`被分为了两种，一种是触发异步处理的，一种是普通的同步`action`。
>
> 2. 异步`action`使用`Redux-Saga`来监听，监听的时候可以使用`takeLatest`或者`takeEvery`来处理并发的请求。
>
> 3. 具体的`saga`实现可以使用`Redux-Saga`提供的方法，比如`call`，`put`之类的，可以让单元测试更好写。
>
> 4. 一个`action`可以被`Redux-Saga`和`Reducer`同时响应，比如上面的`FETCH_USER_INFO`发出后我还想让页面转个圈，可以直接在`reducer`里面加一个就行:
>
>    ```javascript
>    ...
>    case 'FETCH_USER_INFO':
>          return { ...state, isLoading: true };
>    ...
>    ```

## 手写源码

通过上面这个例子，我们可以看出，`Redux-Saga`的运行是通过这一行代码来实现的：

```javascript
sagaMiddleware.run(rootSaga);
```

整个`Redux-Saga`的运行和原本的`Redux`并不冲突，`Redux`甚至都不知道他的存在，他们之间耦合很小，只在需要的时候通过`put`发出`action`来进行通讯。所以我猜测，他应该是自己实现了一套完全独立的异步任务处理机制，下面我们从能感知到的`API`入手，一步一步来探寻下他源码的奥秘吧。本文全部代码参照官方源码写成，函数名字和变量名字尽量保持一致，写到具体的方法的时候我也会贴出对应的代码地址，主要代码都在这里:[https://github.com/redux-saga/redux-saga/tree/master/packages/core/src](https://github.com/redux-saga/redux-saga/tree/master/packages/core/src)

先来看看我们用到了哪些`API`，这些API就是我们今天手写的目标:

> 1. **createSagaMiddleware**：这个方法会返回一个中间件实例`sagaMiddleware`
> 2. **sagaMiddleware.run**: 这个方法是真正运行我们写的`saga`的入口
> 3. **takeEvery**：这个方法是用来控制并发流程的
> 4. **call**：用来调用其他方法
> 5. **put**：发出`action`，用来和`Redux`通讯

### 从中间件入手

[之前我们讲`Redux`源码的时候详细分析了`Redux`中间件的原理和范式](https://juejin.im/post/6845166891682512909#heading-7)，一个中间件大概就长这个样子:

```javascript
function logger(store) {
  return function(next) {
    return function(action) {
      console.group(action.type);
      console.info('dispatching', action);
      let result = next(action);
      console.log('next state', store.getState());
      console.groupEnd();
      return result
    }
  }
}
```

这其实就相当于一个`Redux`中间件的范式了：

> 1. 一个中间件接收`store`作为参数，会返回一个函数
> 2. 返回的这个函数接收老的`dispatch`函数作为参数(也就是上面的`next`)，会返回一个新的函数
> 3. 返回的新函数就是新的`dispatch`函数，这个函数里面可以拿到外面两层传进来的`store`和老`dispatch`函数

依照这个范式以及前面对`createSagaMiddleware`的使用，我们可以先写出这个函数的骨架：

```javascript
// sagaMiddlewareFactory其实就是我们外面使用的createSagaMiddleware
function sagaMiddlewareFactory() {
  // 返回的是一个Redux中间件
  // 需要符合他的范式
  const sagaMiddleware = function (store) {
    return function (next) {
      return function (action) {
        // 内容先写个空的
        let result = next(action);
        return result;
      }
    }
  }
  
  // sagaMiddleware上还有个run方法
  // 是用来启动saga的
  // 我们先留空吧
  sagaMiddleware.run = () => { }

  return sagaMiddleware;
}

export default sagaMiddlewareFactory;
```

### 梳理架构

现在我们有了一个空的骨架，接下来该干啥呢?前面我们说过了，`Redux-Saga`很可能是自己实现了一套完全独立的异步事件处理机制。这种异步事件处理机制需要一个处理中心来存储事件和处理函数，还需要一个方法来触发队列中的事件的执行，再回看前面的使用的API，我们发现了两个类似功能的API：

> 1. **takeEvery(action, callback)**：他接收的参数就是`action`和`callback`，而且我们在根`saga`里面可能会多次调用它来注册不同`action`的处理函数，这其实就相当于往处理中心里面塞入事件了。
> 2. **put(action)**：`put`的参数是`action`，他唯一的作用就是触发对应事件的回调运行。

可以看到`Redux-Saga`这种机制也是用`takeEvery`先注册回调，然后使用`put`发出消息来触发回调执行，这其实跟我们其他文章多次提到的发布订阅模式很像。

### 手写channel

`channel`是`Redux-Saga`保存回调和触发回调的地方，类似于发布订阅模式，我们先来写个：

```javascript
export function multicastChannel() {
  const currentTakers = [];     // 一个变量存储我们所有注册的事件和回调

  // 保存事件和回调的函数
  // Redux-Saga里面take接收回调和匹配方法matcher两个参数
  // 事实上take到的事件名称也被封装到了matcher里面
  function take(cb, matcher) {
    cb['MATCH'] = matcher;
    currentTakers.push(cb);
  }

  function put(input) {
    const takers = currentTakers;

    for (let i = 0, len = takers.length; i < len; i++) {
      const taker = takers[i]

      // 这里的'MATCH'是上面take塞进来的匹配方法
      // 如果匹配上了就将回调拿出来执行
      if (taker['MATCH'](input)) {
        taker(input);
      }
    }
  }
  
  return {
    take,
    put
  }
}
```

上述代码中有一个奇怪的点，就是将`matcher`作为属性放到了回调函数上，这么做的原因我想是为了让外部可以自定义匹配方法，而不是简单的事件名称匹配，事实上`Redux-Saga`本身就支持好几种匹配模式，包括`字符串，Symbol,数组`等等。

内置支持的匹配方法可以看这里：[https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/matcher.js](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/matcher.js)。

`channel`对应的源码可以看这里：[https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/channel.js#L153](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/channel.js#L153)

有了`channel`之后，我们的中间件里面其实只要再干一件事情就行了，就是调用`channel.put`将接收的`action`再发给`channel`去执行回调就行，所以我们加一行代码:

```javascript
// ... 省略前面代码

const result = next(action);

channel.put(action);     // 将收到的action也发给Redux-Saga

return result;

// ... 省略后面代码
```

### sagaMiddleware.run

前面的`put`是发出事件，执行回调，可是我们的回调还没注册呢，那注册回调应该在什么地方呢？看起来只有一个地方了，那就是`sagaMiddleware.run`。简单来说，`sagaMiddleware.run`接收一个`Generator`作为参数，然后执行这个`Generator`，当遇到`take`的时候就将它注册到`channel`上面去。这里我们先实现`take`，`takeEvery`是在这个基础上实现的。`Redux-Saga`中这块代码是单独抽取了一个文件，我们仿照这种做法吧。

首先需要在中间件里面将`Redux`的`getState`和`dispatch`等参数传递进去，`Redux-Saga`使用的是`bind`函数，所以中间件方法改造如下:

```javascript
function sagaMiddleware({ getState, dispatch }) {
  // 将getState, dispatch通过bind传给runSaga
  boundRunSaga = runSaga.bind(null, {
    channel,
    dispatch,
    getState,
  })

  return function (next) {
    return function (action) {
      const result = next(action);

      channel.put(action);

      return result;
    }
  }
}
```

然后`sagaMiddleware.run`就直接将`boundRunSaga`拿来运行就行了：

```javascript
sagaMiddleware.run = (...args) => {
  boundRunSaga(...args)
}
```

注意这里的`...args`，这个其实就是我们传进去的`rootSaga`。到这里其实中间件部分就已经完成了，后面的代码就是具体的执行过程了。

中间件对应的源码可以看这里：[https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/middleware.js](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/middleware.js)

### runSaga

`runSaga`其实才是真正的`sagaMiddleware.run`，通过前面的分析，我们已经知道他的作用是接收`Generator`并执行，如果遇到`take`就将它注册到`channel`上去，如果遇到`put`就将对应的回调拿出来执行，但是`Redux-Saga`又将这个过程分为了好几层，我们一层一层来看吧。`runSaga`的参数先是通过`bind`传入了一些上下文相关的变量，比如`getState, dispatch`，然后又在运行的时候传入了`rootSaga`，所以他应该是长这个样子的：

```javascript
import proc from './proc';

export function runSaga(
  { channel, dispatch, getState },
  saga,
  ...args
) {
  // saga是一个Generator，运行后得到一个迭代器
  const iterator = saga(...args);

  const env = {
    channel,
    dispatch,
    getState,
  };

  proc(env, iterator);
}
```

可以看到`runSaga`仅仅是将`Generator`运行下，得到迭代器对象后又调用了`proc`来处理。

`runSaga`对应的源码看这里：[https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/runSaga.js](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/runSaga.js)

### proc

`proc`就是具体执行这个迭代器的过程，`Generator`的执行方式我们之前[在另一篇文章详细讲过](https://juejin.im/post/6844904133577670664)，简单来说就是可以另外写一个方法`next`来执行`Generator`，`next`里面检测到如果`Generator`没有执行完，就继续执行`next`，然后外层调用一下`next`启动这个流程就行。

```javascript
export default function proc(env, iterator) {
  // 调用next启动迭代器执行
  next();

  // next函数也不复杂
  // 就是执行iterator
  function next(arg, isErr) {
    let result;
    if (isErr) {
      result = iterator.throw(arg);
    } else {
      result = iterator.next(arg);
    }

    // 如果他没结束，就继续next
    // digestEffect是处理当前步骤返回值的函数
    // 继续执行的next也由他来调用
    if (!result.done) {
      digestEffect(result.value, next)
    }
  }
}
```

#### digestEffect

上面如果迭代器没有执行完，我们会将它的值传给`digestEffect`处理，那么这里的`result.value`的值是什么的呢？回想下我们前面`rootSaga`里面的用法

```javascript
yield takeEvery("FETCH_USER_INFO", fetchUserInfo);
```

`result.value`的值应该是`yield`后面的值，也就是`takeEvery("FETCH_USER_INFO", fetchUserInfo)`的返回值，`takeEvery`是再次包装过的`effect`，他包装了`take，fork`这些简单的`effect`。其实对于像`take`这种简单的`effect`来说，比如:

```javascript
take("FETCH_USER_INFO", fetchUserInfo);
```

这行代码的返回值直接就是一个对象，类似于这样：

```javascript
{
  IO: true,
  type: 'TAKE',
  payload: {},
}
```

所以我们这里`digestEffect`拿到的`result.value`也是这样的一个对象，这个对象就代表了我们的一个`effect`，所以我们的`digestEffect`就长这样：

```javascript
function digestEffect(effect, cb) {    // 这个cb其实就是前面传进来的next
    // 这个变量是用来解决竞争问题的
    let effectSettled;
    function currCb(res, isErr) {
      // 如果已经运行过了，直接return
      if (effectSettled) {
        return
      }

      effectSettled = true;

      cb(res, isErr);
    }

    runEffect(effect, currCb);
  }
```

#### runEffect

可以看到`digestEffect`又调用了一个函数`runEffect`，这个函数会处理具体的`effect`:

```javascript
// runEffect就只是获取对应type的处理函数，然后拿来处理当前effect
function runEffect(effect, currCb) {
  if (effect && effect.IO) {
    const effectRunner = effectRunnerMap[effect.type]
    effectRunner(env, effect.payload, currCb);
  } else {
    currCb();
  }
}
```

这点代码可以看出，`runEffect`也只是对`effect`进行了检测，通过他的类型获取对应的处理函数，然后进行处理，我这里代码简化了，只支持`IO`这种`effect`，官方源码中还支持`promise`和`iterator`，具体的可以看看他的源码：[https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/proc.js](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/proc.js)

### effectRunner

`effectRunner`是通过`effect.type`匹配出来的具体的`effect`的处理函数，我们先来看两个：`take`和`fork`。

#### runTakeEffect

`take`的处理其实很简单，就是将它注册到我们的`channel`里面就行，所以我们建一个`effectRunnerMap.js`文件，在里面添加`take`的处理函数`runTakeEffect`:

```javascript
// effectRunnerMap.js

function runTakeEffect(env, { channel = env.channel, pattern }, cb) {
  const matcher = input => input.type === pattern;

  // 注意channel.take的第二个参数是matcher
  // 我们直接写一个简单的matcher，就是输入类型必须跟pattern一样才行
  // 这里的pattern就是我们经常用的action名字，比如FETCH_USER_INFO
  // Redux-Saga不仅仅支持这种字符串，还支持多种形式，也可以自定义matcher来解析
  channel.take(cb, matcher);
}

const effectRunnerMap = {
  'TAKE': runTakeEffect,
};

export default effectRunnerMap;
```

注意上面代码`channel.take(cb, matcher);`里面的`cb`，这个`cb`其实就是我们迭代器的`next`，也就是说`take`的回调是迭代器继续执行，也就是继续执行下面的代码。也就是说，当你这样写时：

```javascript
yield take("SOME_ACTION");
yield fork(saga);
```

当运行到`yield take("SOME_ACTION");`这行代码时，整个迭代器都阻塞了，不会再往下运行。除非你触发了`SOME_ACTION`，这时候会把`SOME_ACTION`的回调拿出来执行，这个回调就是迭代器的`next`，所以就可以继续执行下面这行代码了`yield fork(saga)`。

#### runForkEffect

我们前面的示例代码其实没有直接用到`fork`这个API，但是用到了`takeEvery`，`takeEvery`其实是组合`take`和`fork`来实现的，所以我们先来看看`fork`。`fork`的使用跟`call`很像，也是可以直接调用传进来的方法，只是`call`会等待结果回来才进行下一步，`fork`不会阻塞这个过程，而是当前结果没回来也会直接运行下一步：

```javascript
fork(fn, ...args);
```

所以当我们拿到`fork`的时候，处理起来也很简单，直接调用`proc`处理`fn`就行了，`fn`应该是一个`Generator`函数。

```javascript
function runForkEffect(env, { fn }, cb) {
  const taskIterator = fn();    // 运行fn得到一个迭代器

  proc(env, taskIterator);      // 直接将taskIterator给proc处理

  cb();      // 直接调用cb，不需要等待proc的结果
}
```

#### runPutEffect

我们前面的例子还用到了`put`这个`effect`，他就更简单了，只是发出一个`action`，事实上他也是调用的`Redux`的`dispatch`来发出`action`：

```javascript
function runPutEffect(env, { action }, cb) {
  const result = env.dispatch(action);     // 直接dispatch(action)

  cb(result);
}
```

注意我们这里的代码只需要`dispatch(action)`就行了，不需要再手动调`channel.put`了，因为我们前面的中间件里面已经改造了`dispatch`方法了，每次`dispatch`的时候都会自动调用`channel.put`。

#### runCallEffect

前面我们发起`API`请求还用到了`call`，一般我们使用`axios`这种库返回的都是一个`promise`，所以我们这里写一种支持`promise`的情况，当然普通同步函数肯定也是支持的：

```javascript
function runCallEffect(env, { fn, args }, cb) {
  const result = fn.apply(null, args);

  if (isPromise(result)) {
    return result
      .then(data => cb(data))
      .catch(error => cb(error, true));
  }

  cb(result);
}
```

这些`effect`具体处理的方法对应的源码都在这个文件里面：[https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/effectRunnerMap.js](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/effectRunnerMap.js)

### effects

上面我们讲了几个`effect`具体处理的方法，但是这些都不是对外暴露的`effect API`。真正对外暴露的`effect API`还需要单独写，他们其实都很简单，都是返回一个带有`type`的简单对象就行：

```javascript
const makeEffect = (type, payload) => ({
  IO: true,
  type,
  payload
})

export function take(pattern) {
  return makeEffect('TAKE', { pattern })
}

export function fork(fn) {
  return makeEffect('FORK', { fn })
}

export function call(fn, ...args) {
  return makeEffect('CALL', { fn, args })
}

export function put(action) {
  return makeEffect('PUT', { action })
}
```

可以看到当我们使用`effect`时，他的返回值就仅仅是一个描述当前任务的对象，这就让我们的单元测试好写很多。我们的代码在不同的环境下运行可能会产生不同的结果，特别是这些异步请求，我们写单元测试时来造这些数据也会很麻烦。但是如果你使用`Redux-Saga`的`effect`，每次你代码运行的时候得到的都是一个任务描述对象，这个对象是稳定的，不受运行结果影响，也就不需要造测试数据了，大大减少了工作量。

`effects`对应的源码文件看这里：[https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/io.js](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/io.js)

### takeEvery

我们前面还用到了`takeEvery`来处理同时发起的多个请求，这个`API`是一个高级API，是封装前面的`take`和`fork`来实现的，[官方源码又构造了一个新的迭代器来组合他们](https://github.com/redux-saga/redux-saga/blob/master/packages/core/src/internal/sagaHelpers/takeEvery.js)，不是很直观。[官方文档中的这种写法反而很好理解](https://redux-saga.js.org/docs/advanced/Concurrency.html)，我这里采用文档中的这种写法:

```javascript
export function takeEvery(pattern, saga) {
  function* takeEveryHelper() {
    while (true) {
      yield take(pattern);
      yield fork(saga);
    }
  }

  return fork(takeEveryHelper);
}
```

上面这段代码就很好理解了，我们一个死循环不停的监听`pattern`，即目标事件，当目标事件过来的时候，就执行对应的`saga`，然后又进入下一次循环继续监听`pattern`。

## 总结

到这里我们例子中用到的`API`已经全部自己实现了，我们可以用自己的这个`Redux-Saga`来替换官方的了，只是我们只实现了他的一部分功能，还有很多功能没有实现，不过这已经不妨碍我们理解他的基本原理了。再来回顾下他的主要要点：

1. `Redux-Saga`其实也是一个发布订阅模式，管理事件的地方是`channel`，两个重点`API`：`take`和`put`。
2. `take`是注册一个事件到`channel`上，当事件过来时触发回调，需要注意的时，这里的回调仅仅是迭代器的`next`，并不是具体响应事件的函数。也就是说`take`的意思就是：我在等某某事件，这个事件来之前不许往下走，来了后就可以往下走了。
3. `put`是发出事件，他是使用`Redux dispatch`发出事件的，也就是说`put`的事件会被`Redux`和`Redux-Saga`同时响应。
4. `Redux-Saga`增强了`Redux`的`dispatch`函数，在`dispatch`的同时会触发`channel.put`，也就是让`Redux-Saga`也响应回调。
5. 我们调用的`effects`和真正实现功能的函数是分开的，表层调用的`effects`只会返回一个简单的对象，这个对象描述了当前任务，他是稳定的，所以基于`effects`的单元测试很好写。
6. 当拿到`effects`返回的对象后，我们再根据他的`type`去找对应的处理函数来进行处理。
7. 整个`Redux-Saga`都是基于`Generator`的，每往下走一步都需要手动调用`next`，这样当他执行到中途的时候我们可以根据情况不再继续调用`next`，这其实就相当于将当前任务`cancel`了。

本文可运行的代码已经上传到GitHub，可以拿下来玩玩：[https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/React/redux-saga](https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/React/redux-saga)

## 参考资料

`Redux-Saga`官方文档：[https://redux-saga.js.org/](https://redux-saga.js.org/)

`Redux-Saga`源码地址： [https://github.com/redux-saga/redux-saga/tree/master/packages/core/src](https://github.com/redux-saga/redux-saga/tree/master/packages/core/src)

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

**我也搞了个公众号[进击的大前端]，不打广告，不写水文，只发高质量原创，欢迎关注~**

![QRCode](../../images/Others/QRCode.jpg)