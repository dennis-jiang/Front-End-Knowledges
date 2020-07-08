import React, { useMemo, useEffect } from 'react';
import ReactReduxContext from './Context';
import Subscription from './Subscription';

function Provider(props) {
  const {store, children} = props;

  // 这是要传递的context
  // 里面放入store和subscription实例
  const contextValue = useMemo(() => {
    const subscription = new Subscription(store)
    // 注册回调为通知子组件，这样就可以开始层级通知了
    subscription.onStateChange = subscription.notifyNestedSubs
    return {
      store,
      subscription
    }
  }, [store])

  // 拿到之前的state值
  const previousState = useMemo(() => store.getState(), [store])

  // 每次contextValue或者previousState变化的时候
  // 用notifyNestedSubs通知子组件
  useEffect(() => {
    const { subscription } = contextValue;
    subscription.trySubscribe()

    if (previousState !== store.getState()) {
      subscription.notifyNestedSubs()
    }
  }, [contextValue, previousState])

  // 返回ReactReduxContext包裹的组件，传入contextValue
  // 里面的内容就直接是children，我们不动他
  return (
    <ReactReduxContext.Provider value={contextValue}>
      {children}
    </ReactReduxContext.Provider>
  )
}

export default Provider;