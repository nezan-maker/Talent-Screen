export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  login: '/login',
  forgotPassword: '/forgot-password',
  register: '/register',
  welcome: '/welcome',
  jobs: '/dashboard/jobs',
  newJob: '/dashboard/jobs/new',
  candidates: '/dashboard/candidates',
  messages: '/dashboard/messages',
  dashboardSettings: '/dashboard/settings',
  contact: '/contact',
  about: '/about',
} as const;

export const SCORE_THRESHOLDS = {
  qualifiedMin: 80,
  maybeMin: 60,
} as const;
