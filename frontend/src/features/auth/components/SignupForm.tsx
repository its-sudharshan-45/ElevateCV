import { Link, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AUTH_ROUTES } from '@/features/auth/constants';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { OAuthDivider } from '@/features/auth/components/OAuthDivider';
import { signupSchema, type SignupFormValues } from '@/features/auth/schemas';
import { getFieldErrors, mapAuthError } from '@/features/auth/utils';
import { createClient } from '@/lib/supabase/client';

const initialValues: SignupFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
};

export function SignupForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<SignupFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignupFormValues, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signupSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setFormError(mapAuthError(error));
        return;
      }

      if (data.session) {
        navigate(AUTH_ROUTES.dashboard, { replace: true });
        return;
      }

      setFormError(null);
      navigate(`${AUTH_ROUTES.login}?registered=1`, { replace: true });
    } catch {
      setFormError('Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start building your career readiness profile.</CardDescription>
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
              aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              disabled={isSubmitting}
              required
            />
            <FormMessage id="signup-email-error" message={fieldErrors.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
              onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
              disabled={isSubmitting}
              required
            />
            <FormMessage id="signup-password-error" message={fieldErrors.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={
                fieldErrors.confirmPassword ? 'signup-confirm-password-error' : undefined
              }
              onChange={(event) =>
                setValues((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              disabled={isSubmitting}
              required
            />
            <FormMessage
              id="signup-confirm-password-error"
              message={fieldErrors.confirmPassword}
            />
          </div>

          <FormMessage message={formError ?? undefined} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <OAuthDivider />
        <GoogleAuthButton label="Sign up with Google" />

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={AUTH_ROUTES.login} className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
