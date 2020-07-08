import React from 'react';
import ReactDOM from 'react-dom';
// import { Provider } from 'react-redux'
import { Provider } from './my-react-redux';
import store from './store'
import App from './App';
import TestContext from './TestContext';

const setting = {
  color: '#d89151'
}

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <TestContext.Provider value={setting}>
        <App />
      </TestContext.Provider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

