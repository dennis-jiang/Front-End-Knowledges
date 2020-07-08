import React, { useContext } from 'react';
// import { connect } from 'react-redux';
import { connect } from './my-react-redux';

function SubCounter(props) {
  const { 
    count,
   } = props;

  return (
    <>
      <h4>子组件Count: {count}</h4>
    </>
  );
}

const mapStateToProps = (state) => {
  return {
    count: state.count
  }
}

export default connect(
  mapStateToProps
)(SubCounter)