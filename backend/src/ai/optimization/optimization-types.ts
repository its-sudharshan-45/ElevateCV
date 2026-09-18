import { z } from 'zod';

// ---------------------------------------------------------------------------
// Per-section optimization output
// ---------------------------------------------------------------------------

export const optimizedSectionSchema = z.object({
  key: z.enum(['summary', 'experience', 'projects', 'skills']),
  original: z.string(),
  improved: z.string(),
  reason: z.string(),
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
