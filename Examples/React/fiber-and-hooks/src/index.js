// import React from 'react';
// import ReactDOM from 'react-dom';
import React from './myReact';
const ReactDOM = React;

function App(props) {
  const [count, setCount] = React.useState(1);
  console.log('count', count);
  const onClickHandler = () => {
    console.log('onClick count', count);
    const newCount = count + 1;
    console.log('newCount', newCount);
    setCount(newCount);
  }
  return (
    <div>
      <h1 id="title">{props.title}</h1>
      <a href="xxx">Jump</a>
      <section>
        <p>
          Article
        </p>
      </section>
      <hr></hr>
      <h1>Count: {count}</h1>
      <button onClick={onClickHandler}>增加Count</button>
    </div>
  );
}

ReactDOM.render(
  <App title="Fiber"/>,
  document.getElementById('root')
);