import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProfileForm } from './ProfileForm';

const { navigate, signOut, authenticatedApiFetch } = vi.hoisted(() => ({
  navigate: vi.fn(),
  signOut: vi.fn(),
  authenticatedApiFetch: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('../../../lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut,
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  }),
}));

vi.mock('../../../lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/api/client')>(
    '../../../lib/api/client',
  );

  return {
    ...actual,
    authenticatedApiFetch,
  };
});

const baseProfile = {
  id: 'user-1',
  fullName: 'Jane Doe',
  headline: null,
  targetRole: 'Software Engineer',
  experienceLevel: 'student' as const,
  college: 'MIT',
  degree: 'B.Tech',
  fieldOfStudy: 'Computer Science',
  graduationYear: 2025,
  currentStatus: 'fresher' as const,
  skills: ['JavaScript', 'TypeScript'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfileForm', () => {
  beforeEach(() => {
    authenticatedApiFetch.mockReset();
    signOut.mockReset();
    navigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders step 1 with loaded profile data', async () => {
    authenticatedApiFetch.mockResolvedValue({ profile: baseProfile });

    render(<ProfileForm />);

    const fullNameInput = await screen.findByLabelText(/full name/i);
    expect((fullNameInput as HTMLInputElement).value).toBe('Jane Doe');

    const collegeInput = screen.getByLabelText(/college/i);
    expect((collegeInput as HTMLInputElement).value).toBe('MIT');
  });

  it('advances from step 1 to step 2 when Next is clicked', async () => {
    authenticatedApiFetch.mockResolvedValue({ profile: baseProfile });

    render(<ProfileForm />);

    await screen.findByLabelText(/full name/i);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2 fields should appear
    expect(await screen.findByLabelText(/current status/i)).toBeTruthy();
    expect(screen.getByLabelText(/experience level/i)).toBeTruthy();
  });

  it('advances from step 2 to step 3', async () => {
    authenticatedApiFetch.mockResolvedValue({ profile: baseProfile });

    render(<ProfileForm />);

    // skip to step 2
    await screen.findByLabelText(/full name/i);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByLabelText(/current status/i);

    // skip to step 3
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByLabelText(/add a skill/i)).toBeTruthy();
  });

  it('saves profile on final step submission', async () => {
    authenticatedApiFetch.mockImplementation(async (_path: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return { profile: { ...baseProfile, updatedAt: '2026-01-02T00:00:00.000Z' } };
      }
      return { profile: baseProfile };
    });

    render(<ProfileForm />);

    // Step 1
    await screen.findByLabelText(/full name/i);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2
    await screen.findByLabelText(/current status/i);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 3
    await screen.findByLabelText(/add a skill/i);
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(authenticatedApiFetch).toHaveBeenCalledWith(
        '/profile',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    expect(await screen.findByText('Profile saved successfully.')).toBeTruthy();
  });

  it('blocks step 1 advance when full name is empty', async () => {
    authenticatedApiFetch.mockResolvedValue({
      profile: { ...baseProfile, fullName: null },
    });

    render(<ProfileForm />);

    const fullNameInput = await screen.findByLabelText(/full name/i);
    fireEvent.change(fullNameInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Should still be on step 1
    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.queryByLabelText(/current status/i)).toBeNull();
  });

  it('logs out and redirects to login', async () => {
    authenticatedApiFetch.mockResolvedValue({ profile: baseProfile });
    signOut.mockResolvedValue({ error: null });

    render(<ProfileForm />);

    expect(await screen.findByDisplayValue('Jane Doe')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});
