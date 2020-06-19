// import React from 'react';
// import ReactDOM from 'react-dom';
import React from './myReact';
const ReactDOM = React;

function Count3() {
  const [count, setCount] = React.useState(1);
  
  const onClickHandler = () => {
    setCount(count + 1);
  }

  return (
    <div>
      <h3>Another function component Count: {count}</h3>
      <button onClick={onClickHandler}>Count+1</button>
    </div>
  );
}

function App(props) {
  const [count, setCount] = React.useState(1);
  const [count2, setCount2] = React.useState(1);
  
  const onClickHandler = () => {
    setCount(count + 1);
  }

  const onClickHandler2 = () => {
    setCount2(count2 + 1);
  }
  return (
    <div>
      <h1 id="title">{props.title}</h1>
      <section>
        <h3>Count1: {count}</h3>
        <button onClick={onClickHandler}>Count1+1</button>
        <h3>Count2: {count2}</h3>
        <button onClick={onClickHandler2}>Count2+1</button>
        <Count3></Count3>
      </section>
    </div>
  );
}

ReactDOM.render(
  <App title="Fiber Demo"/>,
  document.getElementById('root')
);