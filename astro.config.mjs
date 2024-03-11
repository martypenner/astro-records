import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

const DEV_PARTYKIT_HOST = '127.0.0.1:1999';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'server',
  adapter: cloudflare(),

  vite: {
    define: {
      'import.meta.env.PARTYKIT_HOST': JSON.stringify(DEV_PARTYKIT_HOST),
    },
  },
});
