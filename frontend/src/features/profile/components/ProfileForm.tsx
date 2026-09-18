import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AUTH_ROUTES } from '@/features/auth/constants';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  type Step1Values,
  type Step2Values,
  type Step3Values,
} from '@/features/profile/schemas';
import { getFieldErrors } from '@/features/auth/utils';
import { ApiClientError, authenticatedApiFetch } from '@/lib/api/client';
import { uploadResume } from '@/features/resume/api/resume.api';
import { createClient } from '@/lib/supabase/client';
import {
  CURRENT_STATUS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  type CurrentStatus,
  type ExperienceLevel,
  type Profile,
  type ProfileResponse,
} from '@/types/profile';

// ─── Types ────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

const emptyStep1: Step1Values = {
  fullName: '',
  college: '',
  degree: '',
  fieldOfStudy: '',
  graduationYear: null,
};

const emptyStep2: Step2Values = {
  currentStatus: 'student',
  targetRole: '',
  experienceLevel: 'student',
};

const emptyStep3: Step3Values = {
  skills: [],
};

function toStep1(profile: Profile): Step1Values {
  return {
    fullName: profile.fullName ?? '',
    college: profile.college ?? '',
    degree: profile.degree ?? '',
    fieldOfStudy: profile.fieldOfStudy ?? '',
    graduationYear: profile.graduationYear ?? null,
  };
}

function toStep2(profile: Profile): Step2Values {
  return {
    currentStatus: profile.currentStatus ?? 'student',
    targetRole: profile.targetRole ?? '',
    experienceLevel: profile.experienceLevel ?? 'student',
  };
}

function toStep3(profile: Profile): Step3Values {
  return {
    skills: profile.skills ?? [],
  };
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ['Education', 'Career', 'Skills & Resume'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0" aria-label="Form progress">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const isComplete = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  isComplete
                    ? 'bg-[#6E44FF] text-white'
                    : isActive
                      ? 'bg-[#6E44FF]/10 text-[#6E44FF] ring-2 ring-[#6E44FF]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
                ].join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                {isComplete ? (
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8l3.5 3.5L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={[
                  'text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap',
                  isActive ? 'text-[#6E44FF]' : 'text-slate-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                className={[
                  'h-px w-10 sm:w-16 mx-2 mb-5 transition-all duration-300',
                  isComplete ? 'bg-[#6E44FF]' : 'bg-slate-200 dark:bg-slate-700',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Skill Tag Input ──────────────────────────────────────────────────────────

function SkillTagInput({
  skills,
  onChange,
  disabled,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addSkill(raw: string) {
    const tag = raw.trim();
    if (tag && !skills.includes(tag) && skills.length < 50) {
      onChange([...skills, tag]);
    }
    setDraft('');
  }

  function removeSkill(skill: string) {
    onChange(skills.filter((s) => s !== skill));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(draft);
    } else if (e.key === 'Backspace' && draft === '' && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  }

  return (
    <div
      className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-md border border-input bg-background cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 transition-shadow"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6E44FF]/10 text-[#6E44FF] dark:bg-[#6E44FF]/20 text-xs font-medium"
        >
          {skill}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(skill);
              }}
              className="ml-0.5 hover:text-[#5233cc] focus:outline-none"
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addSkill(draft)}
        disabled={disabled}
        placeholder={skills.length === 0 ? 'Type a skill and press Enter or comma…' : ''}
        className="flex-1 min-w-[160px] bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        aria-label="Add a skill"
      />
    </div>
  );
}

// ─── Resume Upload ─────────────────────────────────────────────────────────────

function ResumeUploadField({
  file,
  onChange,
  error,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor="resume-upload">Resume — PDF</Label>
      <div
        className={[
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors cursor-pointer',
          file
            ? 'border-[#6E44FF] bg-[#6E44FF]/5'
            : 'border-slate-200 dark:border-slate-700 hover:border-[#6E44FF]/50',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-describedby={error ? 'resume-error' : undefined}
      >
        <svg
          className={`h-8 w-8 ${file ? 'text-[#6E44FF]' : 'text-slate-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {file ? (
          <span className="text-sm font-medium text-[#6E44FF]">{file.name}</span>
        ) : (
          <>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Click to upload or drag & drop
            </span>
            <span className="text-xs text-slate-400">PDF only · Max 5 MB</span>
          </>
        )}
        <input
          ref={inputRef}
          id="resume-upload"
          type="file"
          accept="application/pdf"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
      {file && !disabled && (
        <button
          type="button"
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
          onClick={() => onChange(null)}
        >
          Remove file
        </button>
      )}
      <FormMessage id="resume-error" message={error} />
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function ProfileForm() {
  const navigate = useNavigate();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [step1, setStep1] = useState<Step1Values>(emptyStep1);
  const [step2, setStep2] = useState<Step2Values>(emptyStep2);
  const [step3, setStep3] = useState<Step3Values>(emptyStep3);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Field errors per step
  const [step1Errors, setStep1Errors] = useState<Partial<Record<keyof Step1Values, string>>>({});
  const [step2Errors, setStep2Errors] = useState<Partial<Record<keyof Step2Values, string>>>({});
  const [step3Errors, setStep3Errors] = useState<Partial<Record<keyof Step3Values, string>>>({});
  const [resumeError, setResumeError] = useState<string | undefined>();

  // Load / save state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Load existing profile ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await authenticatedApiFetch<ProfileResponse>('/profile');
        if (!cancelled) {
          setStep1(toStep1(data.profile));
          setStep2(toStep2(data.profile));
          setStep3(toStep3(data.profile));
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiClientError && error.status === 401) {
            navigate(AUTH_ROUTES.login, { replace: true });
            return;
          }
          setLoadError(
            error instanceof ApiClientError
              ? error.message
              : 'Unable to load your profile. Please try again.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  async function handleLogout() {
    setIsLoggingOut(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSaveError('Unable to log out. Please try again.');
        return;
      }
      navigate(AUTH_ROUTES.login, { replace: true });
    } catch {
      setSaveError('Unable to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  // ── Step validation & navigation ──────────────────────────────────────────
  function validateAndAdvance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    if (currentStep === 1) {
      const parsed = step1Schema.safeParse(step1);
      if (!parsed.success) {
        setStep1Errors(getFieldErrors(parsed.error));
        return;
      }
      setStep1Errors({});
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const parsed = step2Schema.safeParse(step2);
      if (!parsed.success) {
        setStep2Errors(getFieldErrors(parsed.error));
        return;
      }
      setStep2Errors({});
      setCurrentStep(3);
    }
  }

  // ── Final submit ──────────────────────────────────────────────────────────
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    const parsed = step3Schema.safeParse(step3);
    if (!parsed.success) {
      setStep3Errors(getFieldErrors(parsed.error));
      return;
    }
    setStep3Errors({});
    setIsSaving(true);

    try {
      // 1. PATCH profile
      const payload = {
        fullName: step1.fullName.trim(),
        college: step1.college?.trim() || null,
        degree: step1.degree?.trim() || null,
        fieldOfStudy: step1.fieldOfStudy?.trim() || null,
        graduationYear: step1.graduationYear ?? null,
        currentStatus: step2.currentStatus,
        targetRole: step2.targetRole?.trim() || null,
        experienceLevel: step2.experienceLevel,
        skills: step3.skills,
      };

      const data = await authenticatedApiFetch<ProfileResponse>('/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setStep1(toStep1(data.profile));
      setStep2(toStep2(data.profile));
      setStep3(toStep3(data.profile));

      // 2. Upload resume if provided
      if (resumeFile) {
        setResumeError(undefined);
        try {
          await uploadResume(resumeFile);
          setResumeFile(null);
        } catch (err) {
          setResumeError(
            err instanceof ApiClientError ? err.message : 'Resume upload failed. Try again.',
          );
        }
      }

      setSuccessMessage('Profile saved successfully.');
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        navigate(AUTH_ROUTES.login, { replace: true });
        return;
      }
      setSaveError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to save your profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Career profile</CardTitle>
          <CardDescription>Loading your profile…</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            Please wait while we retrieve your career profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Load error ─────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Career profile</CardTitle>
          <CardDescription>We could not load your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormMessage message={loadError} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Wizard form ────────────────────────────────────────────────────────────
  const isStep3 = currentStep === TOTAL_STEPS;
  const onSubmit = isStep3 ? handleSubmit : validateAndAdvance;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Career profile</CardTitle>
          <CardDescription>
            Tell us about yourself so we can match you to the right jobs and recommendations.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut || isSaving}
        >
          {isLoggingOut ? 'Logging out…' : 'Log out'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step indicator */}
        <StepIndicator current={currentStep} />

        {/* Animated step panels */}
        <form
          key={currentStep}
          onSubmit={onSubmit}
          className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
          noValidate
        >
          {/* ── Step 1: Education ────────────────────────────────────────── */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={step1.fullName}
                  aria-invalid={Boolean(step1Errors.fullName)}
                  aria-describedby={step1Errors.fullName ? 'fullName-error' : undefined}
                  onChange={(e) => setStep1((p) => ({ ...p, fullName: e.target.value }))}
                  disabled={isSaving}
                  required
                  placeholder="e.g. Jane Doe"
                />
                <FormMessage id="fullName-error" message={step1Errors.fullName} />
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Education
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="college">College / University</Label>
                    <Input
                      id="college"
                      name="college"
                      value={step1.college ?? ''}
                      onChange={(e) => setStep1((p) => ({ ...p, college: e.target.value }))}
                      disabled={isSaving}
                      placeholder="e.g. MIT"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Input
                      id="degree"
                      name="degree"
                      value={step1.degree ?? ''}
                      onChange={(e) => setStep1((p) => ({ ...p, degree: e.target.value }))}
                      disabled={isSaving}
                      placeholder="e.g. B.Tech"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fieldOfStudy">Field of Study</Label>
                    <Input
                      id="fieldOfStudy"
                      name="fieldOfStudy"
                      value={step1.fieldOfStudy ?? ''}
                      onChange={(e) => setStep1((p) => ({ ...p, fieldOfStudy: e.target.value }))}
                      disabled={isSaving}
                      placeholder="e.g. Computer Science"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      name="graduationYear"
                      type="number"
                      min={1950}
                      max={2099}
                      value={step1.graduationYear ?? ''}
                      aria-invalid={Boolean(step1Errors.graduationYear)}
                      aria-describedby={
                        step1Errors.graduationYear ? 'graduationYear-error' : undefined
                      }
                      onChange={(e) =>
                        setStep1((p) => ({
                          ...p,
                          graduationYear: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      disabled={isSaving}
                      placeholder="e.g. 2025"
                    />
                    <FormMessage
                      id="graduationYear-error"
                      message={step1Errors.graduationYear as string | undefined}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Career ───────────────────────────────────────────── */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="currentStatus">
                  Current Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="currentStatus"
                  name="currentStatus"
                  value={step2.currentStatus}
                  aria-invalid={Boolean(step2Errors.currentStatus)}
                  aria-describedby={step2Errors.currentStatus ? 'currentStatus-error' : undefined}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, currentStatus: e.target.value as CurrentStatus }))
                  }
                  disabled={isSaving}
                  required
                >
                  {CURRENT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <FormMessage id="currentStatus-error" message={step2Errors.currentStatus} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Job Role</Label>
                <Input
                  id="targetRole"
                  name="targetRole"
                  value={step2.targetRole ?? ''}
                  onChange={(e) => setStep2((p) => ({ ...p, targetRole: e.target.value }))}
                  disabled={isSaving}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">
                  Experience Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={step2.experienceLevel}
                  aria-invalid={Boolean(step2Errors.experienceLevel)}
                  aria-describedby={
                    step2Errors.experienceLevel ? 'experienceLevel-error' : undefined
                  }
                  onChange={(e) =>
                    setStep2((p) => ({
                      ...p,
                      experienceLevel: e.target.value as ExperienceLevel,
                    }))
                  }
                  disabled={isSaving}
                  required
                >
                  {EXPERIENCE_LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <FormMessage id="experienceLevel-error" message={step2Errors.experienceLevel} />
              </div>
            </>
          )}

          {/* ── Step 3: Skills & Resume ──────────────────────────────────── */}
          {currentStep === 3 && (
            <>
              <div className="space-y-2">
                <Label>Technical Skills</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Type a skill and press{' '}
                  <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                    Enter
                  </kbd>{' '}
                  or comma to add.
                </p>
                <SkillTagInput
                  skills={step3.skills}
                  onChange={(skills) => setStep3((p) => ({ ...p, skills }))}
                  disabled={isSaving}
                />
                <FormMessage message={step3Errors.skills as string | undefined} />
              </div>

              <ResumeUploadField
                file={resumeFile}
                onChange={setResumeFile}
                error={resumeError}
                disabled={isSaving}
              />

              {successMessage ? (
                <p className="text-sm text-green-700 dark:text-green-400" role="status" aria-live="polite">
                  {successMessage}
                </p>
              ) : null}
              <FormMessage message={saveError ?? undefined} />
            </>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1 || isSaving}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              ← Back
            </Button>

            <Button type="submit" disabled={isSaving || isLoggingOut}>
              {isSaving
                ? 'Saving…'
                : isStep3
                  ? 'Save Profile'
                  : `Next →`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
