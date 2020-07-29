import React from 'react';
// import { Link } from 'react-router-dom';
import Link from '../myReactRouter/react-router-dom/Link';

function Home() {
  return (
    <>
      <h1>首页</h1>
      <ul>
        <li><Link to="/login">登录</Link></li>
        <li><Link to="/backend">后台</Link></li>
        <li><Link to="/admin">管理员</Link></li>
      </ul>
    </>
  );
}

export default Home;