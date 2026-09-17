import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AUTH_ROUTES } from '@/features/auth/constants';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { OAuthDivider } from '@/features/auth/components/OAuthDivider';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { getFieldErrors, mapAuthError } from '@/features/auth/utils';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Surface OAuth errors forwarded back via the ?error= query param.
  const oauthError = searchParams.get('error');
  const initialFormError = oauthError
    ? 'Could not sign in with Google. Please try again.'
    : null;

  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(initialFormError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setFormError(mapAuthError(error));
        return;
      }

      const nextPath = searchParams.get('next');
      const destination =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : AUTH_ROUTES.dashboard;

      navigate(destination, { replace: true });
    } catch {
      setFormError('Unable to log in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Access your career profile and preparation tools.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              disabled={isSubmitting}
              required
            />
            <FormMessage id="email-error" message={fieldErrors.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
              disabled={isSubmitting}
              required
            />
            <FormMessage id="password-error" message={fieldErrors.password} />
          </div>

          <FormMessage message={formError ?? undefined} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <OAuthDivider />
        <GoogleAuthButton redirectTo={searchParams.get('next') ?? undefined} />

        <p className="mt-4 text-sm text-muted-foreground">
          Need an account?{' '}
          <Link to={AUTH_ROUTES.signup} className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
