// import React from 'react';
// import ReactDOM from 'react-dom';
import React from './myReact';
const ReactDOM = React;

const App =
(
  <div>
    <h1 id="title">Title</h1>
    <a href="xxx">Jump</a>
    <section>
      <p>
        Article
      </p>
    </section>
  </div>
);

ReactDOM.render(
  App,
  document.getElementById('root')
);