import { createStore, applyMiddleware } from 'redux';
// import createSagaMiddleware from 'redux-saga';
import createSagaMiddleware from './myReduxSaga'
import reducer from './reducer';
import rootSaga from './saga';

const sagaMiddleware = createSagaMiddleware()

let store = createStore(reducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(rootSaga);

export default store;