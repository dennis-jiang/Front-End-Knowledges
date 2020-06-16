// import React from 'react';
// import ReactDOM from 'react-dom';
import React from './myReact';
const ReactDOM = React;

function App(props) {
  return (
    <div>
      <h1 id="title">{props.title}</h1>
      <a href="xxx">Jump</a>
      <section>
        <p>
          Article
        </p>
      </section>
    </div>
  );
}

ReactDOM.render(
  <App title="Fiber"/>,
  document.getElementById('root')
);