function increment() {
  return {
    type: 'INCREMENT'
  }
}

function decrement() {
  return {
    type: 'DECREMENT'
  }
}

function reset() {
  return {
    type: 'RESET'
  }
}

export {increment, decrement, reset};