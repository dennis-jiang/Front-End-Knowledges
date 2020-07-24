import Admin from '../pages/Admin';

const adminRoutes = [
  {
    path: '/admin',
    component: Admin,
    exact: true,
    role: 'admin',
    backUrl: '/backend'
  },
];

export default adminRoutes;