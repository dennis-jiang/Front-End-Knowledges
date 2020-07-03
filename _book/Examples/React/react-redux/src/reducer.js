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