import '@testing-library/jest-dom/vitest';

process.env.VITE_SUPABASE_URL ??= 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.VITE_API_URL ??= 'http://localhost:4000/api/v1';

process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:4000/api/v1';
