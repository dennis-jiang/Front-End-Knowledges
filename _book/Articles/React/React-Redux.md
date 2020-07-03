上一篇文章我们手写了一个Redux，但是单纯的Redux只是一个状态机，是没有UI呈现的，所以一般我们使用的时候都会配合一个UI库，比如在React中使用Redux就会用到`React-Redux`这个库。这个库的作用是将Redux的状态机和React的UI呈现绑定在一起，当你`dispatch action`改变`state`的时候，会自动更新页面。本文还是从它的基本使用入手来自己写一个`React-Redux`，然后替换官方的NPM库，并保持功能一致。

## 基本用法

下面这个简单的例子是一个计数器，跑起来效果如下：

![Jul-02-2020 16-44-04](../../images/React/React-Redux/Jul-02-2020 16-44-04.gif)

要实现这个功能，首先我们要在项目里面添加`react-redux`库，然后用它提供的`Provider`包裹整个`React`App的根组件：

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import store from './store'
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

上面代码可以看到我们还给`Provider`提供了一个参数`store`，这个参数就是Redux的`createStore`生成的`store`，我们需要调一下这个方法，然后将返回的`store`传进去：

```javascript
import { createStore } from 'redux';
import reducer from './reducer';

let store = createStore(reducer);

export default store;
```

上面代码中`createStore`的参数是一个`reducer`，所以我们还要写个`reducer`:

```javascript
const initState = {
  count: 0
};

function reducer(state = initState, action) {
  switch (action.type) {
    case 'INCREMENT':
      return {...state, count: state.count + 1};
    case 'DECREMENT':
      return {...state, count: state.count - 1};
    case 'RESET':
      return {...state, count: 0};
    default:
      return state;
  }
}

export default reducer;
```

这里的`reduce`会有一个初始`state`，里面的`count`是`0`，同时他还能处理三个`action`，这三个`action`对应的是UI上的三个按钮，可以对`state`里面的计数进行加减和重置。到这里其实我们`React-Redux`的接入和`Redux`数据的组织其实已经完成了，后面如果要用`Redux`里面的数据的话，只需要用`count`API将对应的`state`和方法连接到组件里面就行了，比如我们的计数器组件需要`count`这个状态和加一，减一，重置这三个`action`，我们用`connect`将它连接进去就是这样：

```javascript
import React from 'react';
import { connect } from 'react-redux';
import { increment, decrement, reset } from './actions';

function Counter(props) {
  const { 
    count,
    incrementHandler,
    decrementHandler,
    resetHandler
   } = props;

  return (
    <>
      <h3>Count: {count}</h3>
      <button onClick={incrementHandler}>计数+1</button>
      <button onClick={decrementHandler}>计数-1</button>
      <button onClick={resetHandler}>重置</button>
    </>
  );
}

const mapStateToProps = (state) => {
  return {
    count: state.count
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    incrementHandler: () => dispatch(increment()),
    decrementHandler: () => dispatch(decrement()),
    resetHandler: () => dispatch(reset()),
  }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Counter)
```

上面代码可以看到`connect`是一个高阶函数，他的第一阶会接收`mapStateToProps`和`mapDispatchToProps`两个参数，这两个参数都是函数。`mapStateToProps`可以自定义需要将哪些`state`连接到当前组件，这些自定义的`state`可以在组件里面通过`props`拿到。`mapDispatchToProps`方法会传入`dispatch`函数，我们可以自定义一些方法，这些方法可以调用`dispatch`去`dispatch action`，从而触发`state`的更新，这些自定义的方法也可以通过组件的`props`拿到，`connect`的第二阶接收的参数是一个组件，我们可以猜测这个函数的作用就是将前面自定义的`state`和方法注入到这个组件里面，同时要返回一个新的组件给外部调用，所以`connect`其实也是一个高阶组件。

到这里我们汇总来看下我们都用到了哪些API，这些API就是我们后面要手写的目标：

> `Provider`: 用来包裹根组件的组件，作用是注入`Redux`的`store`。
>
> `createStore`: `Redux`用来创建`store`的核心方法，[我们另一篇文章已经手写过了]()。
>
> `connect`：用来将`state`和`dispatch`注入给需要的组件，返回一个新组件，他其实是个高阶组件。

所以`React-Redux`核心其实就两个API，而且两个都是组件，作用还很类似，都是往组件里面注入参数，`Provider`是往根组件注入`store`，`connect`是往需要的组件注入`state`和`dispatch`。

在手写之前我们先来思考下，为什么`React-Redux`要设计这两个API，假如没有这两个API，只用`Redux`可以吗？当然是可以的！其实我们用`Redux`的目的不就是希望用它将整个应用的状态都保存下来，每次操作只用`dispatch action`去更新状态，然后UI就自动更新了吗？那我从根组件开始，每一级都把`store`传下去不就行了吗？每个子组件需要读取状态的时候，直接用`store.getState()`就行了，更新状态的时候就`store.dispatch`，这样其实也能达到目的。但是，如果这样写，子组件如果嵌套层数很多，每一级都需要手动传入`store`，比较丑陋，开发也比较繁琐，而且如果某个新同学忘了传`store`，那后面就是一连串的错误了。所以最好有个东西能够将`store`全局的注入组件树，而不需要一层层作为`props`传递，这个东西就是`Provider`！那`connect`存在的意义是什么呢？这个其实跟`Provider`的实现方式有关系，我们手写了`Provider`再来看看`connect`为什么存在。

## 手写`Provider`

前面讲了`Provider`的目的是全局注入`store`，而React刚好提供了一个全局注入变量的API，这就是`context api`。

### React的context api

