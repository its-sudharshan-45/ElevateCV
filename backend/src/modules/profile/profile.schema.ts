import { z } from 'zod';

const experienceLevelSchema = z.enum(['student', 'intern', 'early_career', 'career_switcher']);
const currentStatusSchema = z.enum(['student', 'fresher', 'working_professional']);

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(120).optional(),
    headline: z.string().trim().max(200).nullable().optional(),
    targetRole: z.string().trim().max(120).nullable().optional(),
    experienceLevel: experienceLevelSchema.nullable().optional(),
    dsaScore: z.number().int().min(0).max(100).optional(),
    college: z.string().trim().max(200).nullable().optional(),
    degree: z.string().trim().max(120).nullable().optional(),
    fieldOfStudy: z.string().trim().max(120).nullable().optional(),
    graduationYear: z.number().int().min(1950).max(2099).nullable().optional(),
    currentStatus: currentStatusSchema.nullable().optional(),
    skills: z.array(z.string().trim().max(60)).max(50).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
