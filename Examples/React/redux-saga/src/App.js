import React from 'react';
import { connect } from 'react-redux';

function App(props) {
  const { dispatch, userInfo } = props;

  const getUserInfo = () => {
    dispatch({ type: 'FETCH_USER_INFO' })
  }

  return (
    <div className="App">
      <button onClick={getUserInfo}>Get User Info</button>
      <br></br>
      {userInfo && JSON.stringify(userInfo)}
    </div>
  );
}

const matStateToProps = (state) => ({
  userInfo: state.userInfo
})

export default connect(matStateToProps)(App);
