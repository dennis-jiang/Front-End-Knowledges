function createThunkMiddleware(extraArgument) {
  return function thunk(store) {
    return function (next) {
      return function (action) {
        // 从store中结构出dispatch, getState
        const { dispatch, getState } = store;

        // 如果action是函数，将它拿出来运行，参数就是dispatch和getState
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);   // 这里还可以传入extraArgument
        }

        // 否则按照普通action处理
        let result = next(action);
        return result
      }
    }
  }
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;