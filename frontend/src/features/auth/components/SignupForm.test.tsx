import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SignupForm } from '@/features/auth/components/SignupForm';

const navigate = vi.fn();
const signUp = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp,
    },
  }),
}));

describe('SignupForm', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows validation error when passwords do not match', async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('shows duplicate signup error', async () => {
    signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'User already registered' },
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeTruthy();
  });
});
