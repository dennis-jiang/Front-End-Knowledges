前段时间，我们写了一篇[Redux源码分析的文章](https://juejin.im/post/6845166891682512909)，也[分析了跟`React`连接的库`React-Redux`的源码实现](https://juejin.im/post/6847902222756347911)。但是在`Redux`的生态中还有一个很重要的部分没有涉及到，那就是**Redux的异步解决方案**。本文会讲解`Redux`官方实现的异步解决方案----`Redux-Thunk`，我们还是会从基本的用法入手，再到原理解析，然后自己手写一个`Redux-Thunk`来替换它，也就是源码解析。

`Redux-Thunk`和前面写过的`Redux`和`React-Redux`其实都是`Redux`官方团队的作品，他们的侧重点各有不同:

> **Redux**：是核心库，功能简单，只是一个单纯的状态机，但是蕴含的思想不简单，是传说中的“百行代码，千行文档”。
>
> **React-Redux**：是跟`React`的连接库，当`Redux`状态更新的时候通知`React`更新组件。
>
> **Redux-Thunk**：提供`Redux`的异步解决方案，弥补`Redux`功能的不足。

## 基本用法

还是以我们之前的[那个计数器作为例子](https://juejin.im/post/6847902222756347911#heading-0)，为了让计数器`+1`，我们会发出一个`action`，像这样：

```javascript
function increment() {
  return {
    type: 'INCREMENT'
  }
};

store.dispatch(increment());
```

原始的`Redux`里面，`action creator`必须返回`plain object`，而且必须是同步的。但是我们的应用里面经常会有定时器，网络请求等等异步操作，使用`Redux-Thunk`就可以发出异步的`action`：

```javascript
function increment() {
  return {
    type: 'INCREMENT'
  }
};

// 异步action creator
function incrementAsync() {
  return (dispatch) => {
    setTimeout(() => {
      dispatch(increment());
    }, 1000);
  }
}

// 使用了Redux-Thunk后dispatch不仅仅可以发出plain object，还可以发出这个异步的函数
store.dispatch(incrementAsync());
```

下面再来看个更实际点的例子，也是[官方文档](https://github.com/reduxjs/redux-thunk#composition)中的例子：

```javascript
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

// createStore的时候传入thunk中间件
const store = createStore(rootReducer, applyMiddleware(thunk));

// 发起网络请求的方法
function fetchSecretSauce() {
  return fetch('https://www.baidu.com/s?wd=Secret%20Sauce');
}

// 下面两个是普通的action
function makeASandwich(forPerson, secretSauce) {
  return {
    type: 'MAKE_SANDWICH',
    forPerson,
    secretSauce,
  };
}

function apologize(fromPerson, toPerson, error) {
  return {
    type: 'APOLOGIZE',
    fromPerson,
    toPerson,
    error,
  };
}

// 这是一个异步action，先请求网络，成功就makeASandwich，失败就apologize
function makeASandwichWithSecretSauce(forPerson) {
  return function (dispatch) {
    return fetchSecretSauce().then(
      (sauce) => dispatch(makeASandwich(forPerson, sauce)),
      (error) => dispatch(apologize('The Sandwich Shop', forPerson, error)),
    );
  };
}

// 最终dispatch的是异步action makeASandwichWithSecretSauce
store.dispatch(makeASandwichWithSecretSauce('Me'));

```

## 为什么要用`Redux-Thunk`？

在继续深入源码前，我们先来思考一个问题，为什么我们要用`Redux-Thunk`，不用它行不行？再仔细看看`Redux-Thunk`的作用：

```javascript
// 异步action creator
function incrementAsync() {
  return (dispatch) => {
    setTimeout(() => {
      dispatch(increment());
    }, 1000);
  }
}

store.dispatch(incrementAsync());
```

他仅仅是让`dispath`多支持了一种类型，就是函数类型，在使用`Redux-Thunk`前我们`dispatch`的`action`必须是一个纯对象(`plain object`)，使用了`Redux-Thunk`后，`dispatch`可以支持函数，这个函数会传入`dispatch`本身作为参数。但是其实我们不使用`Redux-Thunk`也可以达到同样的效果，比如上面代码我完全可以不要外层的`incrementAsync`，直接这样写：

```javascript
setTimeout(() => {
  store.dispatch(increment());
}, 1000);
```

这样写同样可以在1秒后发出增加的`action`，而且代码还更简单，那我们为什么还要用`Redux-Thunk`呢，他存在的意义是什么呢？[stackoverflow对这个问题有一个很好的回答，而且是官方推荐的解释](https://stackoverflow.com/questions/35411423/how-to-dispatch-a-redux-action-with-a-timeout/35415559#35415559)。我再写一遍也不会比他写得更好，所以我就直接翻译了：

**----翻译从这里开始----**

**不要觉得一个库就应该规定了所有事情！**如果你想用JS处理一个延时任务，直接用`setTimeout`就好了，即使你使用了`Redux`也没啥区别。`Redux`确实提供了另一种处理异步任务的机制，但是你应该用它来解决你很多重复代码的问题。如果你没有太多重复代码，使用语言原生方案其实是最简单的方案。

### 直接写异步代码

到目前为止这是最简单的方案，`Redux`也不需要特殊的配置：

```javascript
store.dispatch({ type: 'SHOW_NOTIFICATION', text: 'You logged in.' })
setTimeout(() => {
  store.dispatch({ type: 'HIDE_NOTIFICATION' })
}, 5000)
```

(译注：这段代码的功能是显示一个通知，5秒后自动消失，也就是我们经常使用的`toast`效果，原作者一直以这个为例。)

相似的，如果你是在一个连接了`Redux`组件中使用：

```javascript
this.props.dispatch({ type: 'SHOW_NOTIFICATION', text: 'You logged in.' })
setTimeout(() => {
  this.props.dispatch({ type: 'HIDE_NOTIFICATION' })
}, 5000)
```

唯一的区别就是连接组件一般不需要直接使用`store`，而是将`dispatch`或者`action creator`作为`props`注入，这两种方式对我们都没区别。

如果你不想写重复的`action`名字，你可以将这两个`action`抽取成`action creator`而不是直接`dispatch`一个对象:

```javascript
// actions.js
export function showNotification(text) {
  return { type: 'SHOW_NOTIFICATION', text }
}
export function hideNotification() {
  return { type: 'HIDE_NOTIFICATION' }
}

// component.js
import { showNotification, hideNotification } from '../actions'

this.props.dispatch(showNotification('You just logged in.'))
setTimeout(() => {
  this.props.dispatch(hideNotification())
}, 5000)
```

或者你已经通过`connect()`注入了这两个`action creator`：

```javascript
this.props.showNotification('You just logged in.')
setTimeout(() => {
  this.props.hideNotification()
}, 5000)
```

到目前为止，我们没有使用任何中间件或者其他高级技巧，但是我们同样实现了异步任务的处理。

### 提取异步的Action Creator

使用上面的方式在简单场景下可以工作的很好，但是你可能已经发现了几个问题：

> 1. 每次你想显示`toast`的时候，你都得把这一大段代码抄过来抄过去。
> 2. 现在的`toast`没有`id`，这可能会导致一种竞争的情况：如果你连续快速的显示两次`toast`，当第一次的结束时，他会`dispatch`出`HIDE_NOTIFICATION`，这会错误的导致第二个也被关掉。

为了解决这两个问题，你可能需要将`toast`的逻辑抽取出来作为一个方法，大概长这样：

```js
// actions.js
function showNotification(id, text) {
  return { type: 'SHOW_NOTIFICATION', id, text }
}
function hideNotification(id) {
  return { type: 'HIDE_NOTIFICATION', id }
}

let nextNotificationId = 0
export function showNotificationWithTimeout(dispatch, text) {
  // 给通知分配一个ID可以让reducer忽略非当前通知的HIDE_NOTIFICATION
  // 而且我们把计时器的ID记录下来以便于后面用clearTimeout()清除计时器
  const id = nextNotificationId++
  dispatch(showNotification(id, text))

  setTimeout(() => {
    dispatch(hideNotification(id))
  }, 5000)
}
```

现在你的组件可以直接使用`showNotificationWithTimeout`，再也不用抄来抄去了，也不用担心竞争问题了：

```js
// component.js
showNotificationWithTimeout(this.props.dispatch, 'You just logged in.')

// otherComponent.js
showNotificationWithTimeout(this.props.dispatch, 'You just logged out.')  
```

但是为什么`showNotificationWithTimeout()`要接收`dispatch`作为第一个参数呢？因为他需要将`action`发给`store`。一般组件是可以拿到`dispatch`的，为了让外部方法也能`dispatch`，我们需要给他`dispath`作为参数。

如果你有一个单例的`store`，你也可以让`showNotificationWithTimeout`直接引入这个`store`然后`dispatch` `action`：

```javascript
// store.js
export default createStore(reducer)

// actions.js
import store from './store'

// ...

let nextNotificationId = 0
export function showNotificationWithTimeout(text) {
  const id = nextNotificationId++
  store.dispatch(showNotification(id, text))

  setTimeout(() => {
    store.dispatch(hideNotification(id))
  }, 5000)
}

// component.js
showNotificationWithTimeout('You just logged in.')

// otherComponent.js
showNotificationWithTimeout('You just logged out.') 
```

这样做看起来不复杂，也能达到效果，**但是我们不推荐这种做法！**主要原因是你的`store`必须是单例的，这让`Server Render`实现起来很麻烦。在`Server`端，你会希望每个请求都有自己的`store`，比便于不同的用户可以拿到不同的预加载内容。

一个单例的`store`也让单元测试很难写。测试`action creator`的时候你很难`mock` `store`，因为他引用了一个具体的真实的`store`。你甚至不能从外部重置`store`状态。

所以从技术上来说，你可以从一个`module`导出单例的`store`，但是我们不鼓励这样做。除非你确定加肯定你以后都不会升级`Server Render`。所以我们还是回到前面一种方案吧：

```javascript
// actions.js

// ...

let nextNotificationId = 0
export function showNotificationWithTimeout(dispatch, text) {
  const id = nextNotificationId++
  dispatch(showNotification(id, text))

  setTimeout(() => {
    dispatch(hideNotification(id))
  }, 5000)
}

// component.js
showNotificationWithTimeout(this.props.dispatch, 'You just logged in.')

// otherComponent.js
showNotificationWithTimeout(this.props.dispatch, 'You just logged out.')  
```

这个方案就可以解决重复代码和竞争问题。

### Thunk中间件

对于简单项目，上面的方案应该已经可以满足需求了。

但是对于大型项目，你可能还是会觉得这样使用并不方便。

比如，似乎我们必须将`dispatch`作为参数传递，这让我们分隔容器组件和展示组件变得更困难，因为任何发出异步`Redux action`的组件都必须接收`dispatch`作为参数，这样他才能将它继续往下传。你也不能仅仅使用`connect()`来绑定`action creator`，因为`showNotificationWithTimeout()`并不是一个真正的`action creator`，他返回的也不是`Redux action`。

还有个很尴尬的事情是，你必须记住哪个`action cerator`是同步的，比如`showNotification`，哪个是异步的辅助方法，比如`showNotificationWithTimeout`。这两个的用法是不一样的，你需要小心的不要传错了参数，也不要混淆了他们。

这就是我们为什么需要**找到一个“合法”的方法给辅助方法提供`dispatch`参数，并且帮助`Redux`区分出哪些是异步的`action creator`，好特殊处理他们**。

如果你的项目中面临着类似的问题，欢迎使用`Redux Thunk`中间件。

简单来说，`React Thunk`告诉`Redux`怎么去区分这种特殊的`action`----他其实是个函数：

```javascript
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

const store = createStore(
  reducer,
  applyMiddleware(thunk)
)

// 这个是普通的纯对象action
store.dispatch({ type: 'INCREMENT' })

// 但是有了Thunk，他就可以识别函数了
store.dispatch(function (dispatch) {
  // 这个函数里面又可以dispatch很多action
  dispatch({ type: 'INCREMENT' })
  dispatch({ type: 'INCREMENT' })
  dispatch({ type: 'INCREMENT' })

  setTimeout(() => {
    // 异步的dispatch也可以
    dispatch({ type: 'DECREMENT' })
  }, 1000)
})

```

如果你使用了这个中间件，而且你`dispatch`的是一个函数，`React Thunk`会自己将`dispatch`作为参数传进去。而且他会将这些函数`action`“吃了”，所以不用担心你的`reducer`会接收到奇怪的函数参数。你的`reducer`只会接收到纯对象`action`，无论是直接发出的还是前面那些异步函数发出的。

这个看起来好像也没啥大用，对不对？在当前这个例子确实是的！但是他让我们可以像定义一个普通的`action creator`那样去定义`showNotificationWithTimeout`：

```javascript
// actions.js
function showNotification(id, text) {
  return { type: 'SHOW_NOTIFICATION', id, text }
}
function hideNotification(id) {
  return { type: 'HIDE_NOTIFICATION', id }
}

let nextNotificationId = 0
export function showNotificationWithTimeout(text) {
  return function (dispatch) {
    const id = nextNotificationId++
    dispatch(showNotification(id, text))

    setTimeout(() => {
      dispatch(hideNotification(id))
    }, 5000)
  }
}
```

注意这里的`showNotificationWithTimeout`跟我们前面的那个看起来非常像，但是他并不需要接收`dispatch`作为第一个参数。而是返回一个函数来接收`dispatch`作为第一个参数。

那在我们的组件中怎么使用这个函数呢，我们当然可以这样写：

```javascript
// component.js
showNotificationWithTimeout('You just logged in.')(this.props.dispatch)
```

这样我们直接调用了异步的`action creator`来得到内层的函数，这个函数需要`dispatch`做为参数，所以我们给了他`dispatch`参数。

然而这样使用岂不是更尬，还不如我们之前那个版本的！我们为啥要这么干呢？

我之前就告诉过你：**只要使用了`Redux Thunk`，如果你想`dispatch`一个函数，而不是一个纯对象，这个中间件会自己帮你调用这个函数，而且会将`dispatch`作为第一个参数传进去。**

所以我们可以直接这样干：

```javascript
// component.js
this.props.dispatch(showNotificationWithTimeout('You just logged in.'))
```

最后，对于组件来说，`dispatch`一个异步的`action`(其实是一堆普通`action`)看起来和`dispatch`一个普通的同步`action`看起来并没有啥区别。这是个好现象，因为组件就不应该关心那些动作到底是同步的还是异步的，我们已经将它抽象出来了。

注意因为我们已经教了`Redux`怎么区分这些特殊的`action creator`(我们称之为`thunk action creator`)，现在我们可以在任何普通的`action creator`的地方使用他们了。比如，我们可以直接在`connect()`中使用他们：

```javascript
// actions.js

function showNotification(id, text) {
  return { type: 'SHOW_NOTIFICATION', id, text }
}
function hideNotification(id) {
  return { type: 'HIDE_NOTIFICATION', id }
}

let nextNotificationId = 0
export function showNotificationWithTimeout(text) {
  return function (dispatch) {
    const id = nextNotificationId++
    dispatch(showNotification(id, text))

    setTimeout(() => {
      dispatch(hideNotification(id))
    }, 5000)
  }
}

// component.js

import { connect } from 'react-redux'

// ...

this.props.showNotificationWithTimeout('You just logged in.')

// ...

export default connect(
  mapStateToProps,
  { showNotificationWithTimeout }
)(MyComponent)
```

### 在Thunk中读取State

通常来说，你的`reducer`会包含计算新的`state`的逻辑，但是`reducer`只有当你`dispatch`了`action`才会触发。如果你在`thunk action creator`中有一个副作用(比如一个API调用)，某些情况下，你不想发出这个`action`该怎么办呢？

如果没有`Thunk`中间件，你需要在组件中添加这个逻辑：

```javascript
// component.js
if (this.props.areNotificationsEnabled) {
  showNotificationWithTimeout(this.props.dispatch, 'You just logged in.')
}
```

但是我们提取`action creator`的目的就是为了集中这些在各个组件中重复的逻辑。幸运的是，`Redux Thunk`提供了一个读取当前`store state`的方法。那就是除了传入`dispatch`参数外，他还会传入`getState`作为第二个参数，这样`thunk`就可以读取`store`的当前状态了。

```javascript
let nextNotificationId = 0
export function showNotificationWithTimeout(text) {
  return function (dispatch, getState) {
    // 不像普通的action cerator，这里我们可以提前退出
    // Redux不关心这里的返回值，没返回值也没关系
    if (!getState().areNotificationsEnabled) {
      return
    }

    const id = nextNotificationId++
    dispatch(showNotification(id, text))

    setTimeout(() => {
      dispatch(hideNotification(id))
    }, 5000)
  }
}
```

但是不要滥用这种方法！如果你需要通过检查缓存来判断是否发起API请求，这种方法就很好，但是将你整个APP的逻辑都构建在这个基础上并不是很好。如果你只是用`getState`来做条件判断是否要`dispatch action`，你可以考虑将这些逻辑放到`reducer`里面去。

### 下一步

现在你应该对`thunk`的工作原理有了一个基本的概念，如果你需要更多的例子，可以看这里:[https://redux.js.org/introduction/examples#async](https://redux.js.org/introduction/examples#async)。

你可能会发现很多例子都返回了`Promise`，这个不是必须的，但是用起来却很方便。`Redux`并不关心你的`thunk`返回了什么值，但是他会将这个值通过外层的`dispatch()`返回给你。这就是为什么你可以在`thunk`中返回一个`Promise`并且等他完成：

```javascript
dispatch(someThunkReturningPromise()).then(...)
```

另外你还可以将一个复杂的`thunk action creator`拆分成几个更小的`thunk action creator`。这是因为`thunk`提供的`dispatch`也可以接收`thunk`，所以你可以一直嵌套的`dispatch thunk`。而且结合`Promise`的话可以更好的控制异步流程。

在一些更复杂的应用中，你可能会发现你的异步控制流程通过`thunk`很难表达。比如，重试失败的请求，使用`token`进行重新授权认证，或者在一步一步的引导流程中，使用这种方式可能会很繁琐，而且容易出错。如果你有这些需求，你可以考虑下一些更高级的异步流程控制库，比如[Redux Saga](https://github.com/yelouafi/redux-saga)或者[Redux Loop](https://github.com/raisemarketplace/redux-loop)。可以看看他们，评估下，哪个更适合你的需求，选一个你最喜欢的。

最后，不要使用任何库(包括thunk)如果你没有真实的需求。记住，我们的实现都是要看需求的，也许你的需求这个简单的方案就能满足：

```javascript
store.dispatch({ type: 'SHOW_NOTIFICATION', text: 'You logged in.' })
setTimeout(() => {
  store.dispatch({ type: 'HIDE_NOTIFICATION' })
}, 5000)
```

不要跟风尝试，除非你知道你为什么需要这个！

**----翻译到此结束----**

`StackOverflow`的大神**[Dan Abramov](https://stackoverflow.com/users/458193/dan-abramov)**对这个问题的回答实在太细致，太到位了，以致于我看了之后都不敢再写这个原因了，以此翻译向大神致敬，再贴下这个回答的地址：[https://stackoverflow.com/questions/35411423/how-to-dispatch-a-redux-action-with-a-timeout/35415559#35415559](https://stackoverflow.com/questions/35411423/how-to-dispatch-a-redux-action-with-a-timeout/35415559#35415559)。

PS: Dan Abramov是`Redux`生态的核心作者，这几篇文章讲的`Redux`，`React-Redux`，`Redux-Thunk`都是他的作品。

## 源码解析

上面关于原因的翻译其实已经将`Redux`适用的场景和原理讲的很清楚了，下面我们来看看他的源码，自己仿写一个来替换他。照例我们先来分析下要点:

> 1. `Redux-Thunk`是一个`Redux`中间件，所以他遵守`Redux`中间件的范式。
> 2. `thunk`是一个可以`dispatch`的函数，所以我们需要改写`dispatch`让他接受函数参数。

### `Redux`中间件范式

[在我前面那篇讲`Redux`源码的文章讲过中间件的范式以及`Redux`中这块源码是怎么实现的，没看过或者忘了的朋友可以再去看看。](https://juejin.im/post/6845166891682512909#heading-7)我这里再简单提一下，一个`Redux`中间件结构大概是这样：

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

这里注意几个要点：

> 1. 一个中间件接收`store`作为参数，会返回一个函数
> 2. 返回的这个函数接收老的`dispatch`函数作为参数(也就是代码中的`next`)，会返回一个新的函数
> 3. 返回的新函数就是新的`dispatch`函数，这个函数里面可以拿到外面两层传进来的`store`和老`dispatch`函数

仿照这个范式，我们来写一下`thunk`中间件的结构：

```javascript
function thunk(store) {
  return function (next) {
    return function (action) {
      // 先直接返回原始结果
      let result = next(action);
      return result
    }
  }
}
```

### 处理thunk

根据我们前面讲的，`thunk`是一个函数，接收`dispatch getState`两个参数，所以我们应该将`thunk`拿出来运行，然后给他传入这两个参数，再将它的返回值直接返回就行。

```javascript
function thunk(store) {
  return function (next) {
    return function (action) {
      // 从store中解构出dispatch, getState
      const { dispatch, getState } = store;

      // 如果action是函数，将它拿出来运行，参数就是dispatch和getState
      if (typeof action === 'function') {
        return action(dispatch, getState);
      }

      // 否则按照普通action处理
      let result = next(action);
      return result
    }
  }
}
```

### 接收额外参数withExtraArgument

`Redux-Thunk`还提供了一个API，就是你在使用`applyMiddleware`引入的时候，可以使用`withExtraArgument`注入几个自定义的参数，比如这样：

```javascript
const api = "http://www.example.com/sandwiches/";
const whatever = 42;

const store = createStore(
  reducer,
  applyMiddleware(thunk.withExtraArgument({ api, whatever })),
);

function fetchUser(id) {
  return (dispatch, getState, { api, whatever }) => {
    // 现在你可以使用这个额外的参数api和whatever了
  };
}
```

这个功能要实现起来也很简单，在前面的`thunk`函数外面再包一层就行:

```javascript
// 外面再包一层函数createThunkMiddleware接收额外的参数
function createThunkMiddleware(extraArgument) {
  return function thunk(store) {
    return function (next) {
      return function (action) {
        const { dispatch, getState } = store;

        if (typeof action === 'function') {
          // 这里执行函数时，传入extraArgument
          return action(dispatch, getState, extraArgument);  
        }

        let result = next(action);
        return result
      }
    }
  }
}
```

然后我们的`thunk`中间件其实相当于没传`extraArgument`：

```javascript
const thunk = createThunkMiddleware();
```

而暴露给外面的`withExtraArgument`函数就直接是`createThunkMiddleware`了：

```javascript
thunk.withExtraArgument = createThunkMiddleware;
```

源码解析到此结束。啥，这就完了？是的，这就完了！`Redux-Thunk`就是这么简单，虽然背后的思想比较复杂，但是代码真的只有14行！我当时也震惊了，来看看[官方源码](https://github.com/reduxjs/redux-thunk/blob/master/src/index.js)吧:

```javascript
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

## 总结

1. 如果是`Redux`是“百行代码，千行文档”，那`Redux-Thunk`就是“十行代码，百行思想”。
2. `Redux-Thunk`最主要的作用是帮你给异步`action`传入`dispatch`，这样你就不用从调用的地方手动传入`dispatch`，从而实现了调用的地方和使用的地方的解耦。
3. `Redux`和`Redux-Thunk`让我深深体会到什么叫“编程思想”，编程思想可以很复杂，但是实现可能并不复杂，但是却非常有用。
4. 在我们评估是否要引入一个库时最好想清楚我们为什么要引入这个库，是否有更简单的方案。

## 参考资料

Redux-Thunk文档：[https://github.com/reduxjs/redux-thunk](https://github.com/reduxjs/redux-thunk)

Redux-Thunk源码: [https://github.com/reduxjs/redux-thunk/blob/master/src/index.js](https://github.com/reduxjs/redux-thunk/blob/master/src/index.js)

Dan Abramov在StackOverflow上的回答: [https://stackoverflow.com/questions/35411423/how-to-dispatch-a-redux-action-with-a-timeout/35415559#35415559](https://stackoverflow.com/questions/35411423/how-to-dispatch-a-redux-action-with-a-timeout/35415559#35415559)

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

**我也搞了个公众号[进击的大前端]，不打广告，不写水文，只发高质量原创，欢迎关注~**

![QRCode](../../images/Others/QRCode.jpg)