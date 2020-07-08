import React, { useContext } from 'react';
// import { connect } from 'react-redux';
import { connect } from './my-react-redux';
import { increment, decrement, reset } from './actions';
import TestContext from './TestContext';
import SubCounter from './SubCounter';

function Counter(props) {
  const { 
    count,
    incrementHandler,
    decrementHandler,
    resetHandler
   } = props;

  // return (
  //   <TestContext.Consumer>
  //     {context => 
  //       <>
  //         <h3 style={{color:context.color}}>Count: {count}</h3>
  //         <button onClick={incrementHandler}>计数+1</button>&nbsp;&nbsp;
  //         <button onClick={decrementHandler}>计数-1</button>&nbsp;&nbsp;
  //         <button onClick={resetHandler}>重置</button>
  //       </>
  //     }
  //   </TestContext.Consumer>
  // );

  const context = useContext(TestContext);
  return (
    <>
      <h3 style={{color:context.color}}>Count: {count}</h3>
      <button onClick={incrementHandler}>计数+1</button>&nbsp;&nbsp;
      <button onClick={decrementHandler}>计数-1</button>&nbsp;&nbsp;
      <button onClick={resetHandler}>重置</button>
      <SubCounter></SubCounter>
    </>
  );
}

const mapStateToProps = (state) => {
  return {
    count: state.count
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    incrementHandler: () => dispatch(increment()),
    decrementHandler: () => dispatch(decrement()),
    resetHandler: () => dispatch(reset()),
  }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Counter)