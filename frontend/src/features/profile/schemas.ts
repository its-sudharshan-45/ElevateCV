import { z } from 'zod';

// ─── Per-step schemas ─────────────────────────────────────────────────────────

/** Step 1 — Personal + Education */
export const step1Schema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  college: z.string().trim().max(200).optional().or(z.literal('')),
  degree: z.string().trim().max(120).optional().or(z.literal('')),
  fieldOfStudy: z.string().trim().max(120).optional().or(z.literal('')),
  graduationYear: z
    .number({ invalid_type_error: 'Enter a valid year' })
    .int()
    .min(1950)
    .max(2099)
    .nullable()
    .optional(),
});

/** Step 2 — Career */
export const step2Schema = z.object({
  currentStatus: z.enum(['student', 'fresher', 'working_professional']),
  targetRole: z.string().trim().max(120).optional().or(z.literal('')),
  experienceLevel: z.enum(['student', 'intern', 'early_career', 'career_switcher']),
});

/** Step 3 — Skills (resume file handled separately as FormData) */
export const step3Schema = z.object({
  skills: z.array(z.string().trim().min(1).max(60)).max(50),
});

// ─── Merged submit schema ─────────────────────────────────────────────────────

export const profileSubmitSchema = step1Schema.merge(step2Schema).merge(step3Schema);

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type ProfileSubmitValues = z.infer<typeof profileSubmitSchema>;

// ─── Legacy alias (kept so existing imports don't break immediately) ──────────
export const profileUpdateSchema = profileSubmitSchema;
export type ProfileUpdateFormValues = ProfileSubmitValues;
