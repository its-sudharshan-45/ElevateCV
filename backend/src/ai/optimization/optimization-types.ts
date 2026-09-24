import { z } from 'zod';

// ---------------------------------------------------------------------------
// Suggestion Status Enum
// ---------------------------------------------------------------------------

export const suggestionStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);
export type SuggestionStatus = z.infer<typeof suggestionStatusSchema>;

// ---------------------------------------------------------------------------
// Supported Resume Section Keys for Optimization
// ---------------------------------------------------------------------------

export const optimizableSectionKeySchema = z.enum([
  'summary',
  'experience',
  'projects',
  'skills',
  'education',
  'certifications',
  'achievements',
  'personal',
]);
export type OptimizableSectionKey = z.infer<typeof optimizableSectionKeySchema>;

// ---------------------------------------------------------------------------
// Per-section optimization suggestion output
// ---------------------------------------------------------------------------

export const optimizedSectionSchema = z.object({
  id: z.string().optional(),
  key: optimizableSectionKeySchema,
  section: z.string().optional(),
  original: z.string(),
  improved: z.string(),
  originalContent: z.string().optional(),
  suggestedContent: z.string().optional(),
  reason: z.string(),
  status: suggestionStatusSchema.optional(),
});

export type OptimizedSection = z.infer<typeof optimizedSectionSchema>;

// ---------------------------------------------------------------------------
// Improvement suggestions
// ---------------------------------------------------------------------------

export const optimizationSuggestionSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  text: z.string(),
  impact: z.string(),
});

export type OptimizationSuggestion = z.infer<typeof optimizationSuggestionSchema>;

// ---------------------------------------------------------------------------
// Keyword improvements
// ---------------------------------------------------------------------------

export const keywordImprovementSchema = z.object({
  keyword: z.string(),
  suggestion: z.string(),
});

export type KeywordImprovement = z.infer<typeof keywordImprovementSchema>;

// ---------------------------------------------------------------------------
// Full optimization result — validated by Zod before returning to caller
// ---------------------------------------------------------------------------

export const optimizationResultSchema = z.object({
  optimizedSections: z.array(optimizedSectionSchema),
  suggestions: z.array(optimizationSuggestionSchema),
  keywordImprovements: z.array(keywordImprovementSchema),
  warnings: z.array(z.string()),
});

export type OptimizationResult = z.infer<typeof optimizationResultSchema>;
