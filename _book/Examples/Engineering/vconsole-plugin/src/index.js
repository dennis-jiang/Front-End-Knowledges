import React from 'react';
import ReactDOM from 'react-dom';
import VConsole from 'vconsole';
import './index.css';
import App from './App';
import createPlugin from './vConsolePlugin';

const vConsole = new VConsole();

const plugin = createPlugin(VConsole);
vConsole.addPlugin(plugin);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
