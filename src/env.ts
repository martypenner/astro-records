import { z } from 'zod';

const envVars = z.object({
  VITE_REFLECT_URL: z.string(),
  VITE_PODCAST_INDEX_API_KEY: z.string(),
  VITE_PODCAST_INDEX_API_SECRET: z.string(),
});

export const env = envVars.parse(import.meta.env);
