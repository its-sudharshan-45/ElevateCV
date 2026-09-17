import type { AuthError } from '@supabase/supabase-js';
import type { z } from 'zod';

export function mapAuthError(error: AuthError | null): string {
  if (!error) {
    return 'Authentication failed. Please try again.';
  }

  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password.';
    case 'User already registered':
      return 'An account with this email already exists.';
    case 'Password should be at least 6 characters':
      return 'Password must be at least 8 characters.';
    case 'Unable to validate email address: invalid format':
      return 'Enter a valid email address.';
    default:
      return error.message;
  }
}

export function getFieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>,
): Partial<Record<keyof T, string>> {
  const fieldErrors = error.flatten().fieldErrors as Partial<Record<keyof T, string[]>>;

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? '']),
  ) as Partial<Record<keyof T, string>>;
}
