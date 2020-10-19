const initState = {
  userInfo: null,
  error: ''
};

function reducer(state = initState, action) {
  switch (action.type) {
    case 'FETCH_USER_SUCCEEDED':
      return { ...state, userInfo: action.payload };
    case 'FETCH_USER_FAILED':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export default reducer;