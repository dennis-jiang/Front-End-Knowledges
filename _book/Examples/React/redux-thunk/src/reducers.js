const initState = {
  shop: 'The Sandwich Shop',
  customer: '',
  secretSauce: '',
  error: null
};

function reducer(state = initState, action) {
  switch (action.type) {
    case 'MAKE_SANDWICH':
      return { ...state, customer: action.forPerson, secretSauce: action.sauce };
    case 'APOLOGIZE':
      return { ...state, customer: action.toPerson, error: action.error };
    default:
      return state;
  }
}

export default reducer;
