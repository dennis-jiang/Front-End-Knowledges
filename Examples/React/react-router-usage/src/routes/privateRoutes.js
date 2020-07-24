import Backend from '../pages/Backend';

const privateRoutes = [
  {
    path: '/backend',
    component: Backend,
    exact: true,
    role: 'user',
    backUrl: '/login'
  },
];

export default privateRoutes;