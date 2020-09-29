import { multicastChannel as stdChannel } from './channel';
import { runSaga } from './runSaga';

// sagaMiddlewareFactory其实就是我们外面使用的createSagaMiddleware
function sagaMiddlewareFactory() {
  const channel = stdChannel();

  let boundRunSaga;

  // 返回的是一个Redux中间件
  // 需要符合他的范式
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

        channel.put(action);     // 将收到的action也发给Redux-Saga

        return result;
      }
    }
  }

  // sagaMiddleware上还有个run方法
  // 是用来启动saga的
  sagaMiddleware.run = (...args) => {
    boundRunSaga(...args)
  }

  return sagaMiddleware;
}

export default sagaMiddlewareFactory;