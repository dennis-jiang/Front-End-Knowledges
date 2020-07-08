import React, { useContext, useRef, useLayoutEffect, useReducer } from 'react';
import ReactReduxContext from './Context';
import shallowEqual from './shallowEqual';
import Subscription from './Subscription';

function storeStateUpdatesReducer(count) {
  return count + 1;
}

// 第一层函数接收mapStateToProps和mapDispatchToProps
function connect(
  mapStateToProps = () => {}, 
  mapDispatchToProps = () => {}
  ) {
  function childPropsSelector(store, wrapperProps) {
    const state = store.getState();   // 拿到state

    // 执行mapStateToProps和mapDispatchToProps
    const stateProps = mapStateToProps(state);
    const dispatchProps = mapDispatchToProps(store.dispatch);

    return Object.assign({}, stateProps, dispatchProps, wrapperProps);
  }

  // 第二层函数是个高阶组件，里面获取context
  // 然后执行mapStateToProps和mapDispatchToProps
  // 再将这个结果组合用户的参数作为最终参数渲染WrappedComponent
  // WrappedComponent就是我们使用connext包裹的自己的组件
  return function connectHOC(WrappedComponent) {
    function ConnectFunction(props) {
      // 复制一份props到wrapperProps
      const { ...wrapperProps } = props;

      // 获取context的值
      const contextValue = useContext(ReactReduxContext);

      const { store, subscription: parentSub } = contextValue;  // 解构出store和parentSub
      
      // 组装最终的props
      const actualChildProps = childPropsSelector(store, wrapperProps);

      // 记录上次渲染参数
      const lastChildProps = useRef();
      // 使用useLayoutEffect保证同步执行
      useLayoutEffect(() => {
        lastChildProps.current = actualChildProps;
      }, [actualChildProps]);

      // 使用useReducer触发强制更新
      const [
        ,
        forceComponentUpdateDispatch
      ] = useReducer(storeStateUpdatesReducer, 0)

      // 新建一个subscription实例
      const subscription = new Subscription(store, parentSub);

      // state回调抽出来成为一个方法
      const checkForUpdates = () => {
        const newChildProps = childPropsSelector(store, wrapperProps);
        // 如果参数变了，记录新的值到lastChildProps上
        // 并且强制更新当前组件
        if(!shallowEqual(newChildProps, lastChildProps.current)) {
          lastChildProps.current = newChildProps;

          // 需要一个API来强制更新当前组件
          forceComponentUpdateDispatch();

          // 然后通知子级更新
          subscription.notifyNestedSubs();
        }
      };

      // 使用subscription注册回调
      subscription.onStateChange = checkForUpdates;
      subscription.trySubscribe();

      // 修改传给子级的context
      // 将subscription替换为自己的
      const overriddenContextValue = {
        ...contextValue,
        subscription
      }

      // 渲染WrappedComponent
      // 再次使用ReactReduxContext包裹，传入修改过的context
      return (
        <ReactReduxContext.Provider value={overriddenContextValue}>
          <WrappedComponent {...actualChildProps} />
        </ReactReduxContext.Provider>
      )
    }

    return ConnectFunction;
  }
}

export default connect;