import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config({
  path: '.dev.vars',
});

const DEV_PARTYKIT_HOST = '127.0.0.1:1999';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'server',
  adapter: cloudflare(),

  vite: {
    define: {
      'import.meta.env.PARTYKIT_HOST': JSON.stringify(DEV_PARTYKIT_HOST),
      'import.meta.env.PUBLIC_PODCAST_INDEX_API_KEY': JSON.stringify(
        import.meta.env.PUBLIC_PODCAST_INDEX_API_KEY,
      ),
      'import.meta.env.PUBLIC_PODCAST_INDEX_API_SECRET': JSON.stringify(
        import.meta.env.PUBLIC_PODCAST_INDEX_API_SECRET,
      ),
    },
  },
});
