import React from 'react';
// import { Link } from 'react-router-dom';
import Link from '../myReactRouter/react-router-dom/Link';

function Backend() {
  return (
    <>
      <h1>后台页面</h1>
      <Link to="/">回首页</Link>
    </>
  );
}

export default Backend;