export const AUTH_ROUTES = {
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  profile: '/profile',
} as const;

export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/profile',
  '/resume',
  '/saved',
  '/notifications',
  '/settings',
] as const;

export const PUBLIC_AUTH_ROUTES = [AUTH_ROUTES.login, AUTH_ROUTES.signup] as const;
