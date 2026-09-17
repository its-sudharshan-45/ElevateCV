import { createClient } from '@/lib/supabase/client';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

export async function signIn(credentials: SignInWithPasswordCredentials) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword(credentials);
}

export async function signUp(credentials: SignUpWithPasswordCredentials) {
  const supabase = createClient();
  return supabase.auth.signUp(credentials);
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();
  const callbackUrl = new URL('/auth/callback', window.location.origin);
  if (redirectTo) {
    callbackUrl.searchParams.set('next', redirectTo);
  }

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = createClient();
  return supabase.auth.getSession();
}

export async function getUser() {
  const supabase = createClient();
  return supabase.auth.getUser();
}
