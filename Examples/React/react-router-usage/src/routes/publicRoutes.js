import Login from '../pages/Login';
import Home from '../pages/Home';

const publicRoutes = [
  {
    path: '/login',
    component: Login,
    exact: true,
  },
  {
    path: '/',
    component: Home,
    exact: true,
  },
];

export default publicRoutes;