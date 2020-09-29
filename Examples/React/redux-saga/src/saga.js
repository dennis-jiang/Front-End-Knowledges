// import { call, put, takeEvery } from 'redux-saga/effects';
import { call, put, takeEvery } from './myReduxSaga/effects';
import { fetchUserInfoAPI } from './api';

function* fetchUserInfo() {
  try {
    const user = yield call(fetchUserInfoAPI);
    yield put({ type: "FETCH_USER_SUCCEEDED", payload: user });
  } catch (e) {
    yield put({ type: "FETCH_USER_FAILED", payload: e.message });
  }
}

function* rootSaga() {
  yield takeEvery("FETCH_USER_INFO", fetchUserInfo);
}

export default rootSaga;