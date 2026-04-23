export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  login: '/login',
  forgotPassword: '/forgot-password',
  register: '/register',
  newJob: '/dashboard/jobs/new',
  contact: '/contact',
  about: '/about',
} as const;

export const SCORE_THRESHOLDS = {
  qualifiedMin: 80,
  maybeMin: 60,
} as const;
