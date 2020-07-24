import React from 'react';
import { Link } from 'react-router-dom';

function Login(props) {
  const {loginAsUser, loginAsAdmin, history} = props;

  const userLoginHandler = () => {
    loginAsUser();      // 调用父级方法设置用户权限
    history.replace('/backend');     // 登录后跳转后台页面
  }

  const adminLoginHandler = () => {
    loginAsAdmin();     // 调用父级方法设置管理员权限
    history.replace('/admin');     // 登录后跳转管理员页面
  }

  return (
    <>
      <h1>登录页</h1>
      <button onClick={userLoginHandler}>普通用户登录</button>
      <br/><br/>
      <button onClick={adminLoginHandler}>管理员登录</button>
      <br/><br/>
      <Link to="/">回首页</Link>
    </>
  );
}

export default Login;