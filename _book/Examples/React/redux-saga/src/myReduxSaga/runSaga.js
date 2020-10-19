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