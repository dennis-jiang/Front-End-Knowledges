import React from "react";
import RouterContext from "../react-router/RouterContext";

// LinkAnchor只是渲染了一个没有默认行为的a标签
// 跳转行为由传进来的navigate实现
function LinkAnchor({navigate, ...rest}) {
  let props = {
    ...rest,
    onClick: event => {
      event.preventDefault();
      navigate();
    }
  }

  return <a {...props} />;
}

function Link({
  component = LinkAnchor,
  to,
  ...rest
}) {
  return (
    <RouterContext.Consumer>
      {context => {
        const { history } = context;     // 从RouterContext获取history对象

        const props = {
          ...rest,
          href: to,
          navigate() {
            history.push(to);
          }
        };

        return React.createElement(component, props);
      }}
    </RouterContext.Consumer>
  );
}

export default Link;