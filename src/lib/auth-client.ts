import { createAuthClient } from 'better-auth/react';
import { API_BASE_URL } from './api.ts';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  basePath: '/api/auth',
});
