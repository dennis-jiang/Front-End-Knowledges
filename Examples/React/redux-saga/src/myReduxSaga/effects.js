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

export function takeEvery(pattern, saga) {
  function* takeEveryHelper() {
    while (true) {
      yield take(pattern);
      yield fork(saga);
    }
  }

  return fork(takeEveryHelper);
}
