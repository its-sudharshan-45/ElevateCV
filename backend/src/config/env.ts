// cspell:ignore huggingface
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESUME_STORAGE_BUCKET: z.string().min(1).default('resumes'),
  RESUME_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(5_242_880),

  // AI Provider Configuration
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('groq/compound-mini'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-haiku-latest'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_PRIMARY_PROVIDER: z.enum(['groq', 'anthropic', 'openai']).default('groq'),
  AI_FALLBACK_ENABLED: z
    .preprocess((val) => {
      if (val === undefined || val === '') return true;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1';
    }, z.boolean())
    .default(true),
  AI_FALLBACK_PROVIDERS: z.string().default('anthropic,openai'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  // Hugging Face Configuration
  HF_CACHE_DIR: z.string().default('.cache/huggingface'),
  HF_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error('Invalid environment configuration:', formatted);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
