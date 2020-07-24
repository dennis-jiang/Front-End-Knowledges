import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import privateRoutes from './routes/privateRoutes';
import AuthRoute from './components/AuthRoute';

function App() {
  const [user, setUser] = useState({});

  const loginAsUser = () => {
    setUser({
      role: ['user']
    });
  }

  const loginAsAdmin = () => {
    setUser({
      role: ['user', 'admin']
    });
  }

  return (
    <Router>
      <Switch>
        {publicRoutes.map(
          ({path, component, ...route}) => 
            <Route key={path} path={path} {...route} render={(routeProps) => {
              const Component = component;
              return (
                <Component loginAsUser={loginAsUser} loginAsAdmin={loginAsAdmin} {...routeProps}/>
              )
            }}/>
        )}
        {privateRoutes.map(
          (route) => <AuthRoute key={route.path} {...route} user={user}/>
        )}
        {adminRoutes.map(
          (route) => <AuthRoute key={route.path} {...route} user={user}/>
        )}
      </Switch>
    </Router>
  );
}

export default App;
