/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_PODCAST_INDEX_API_KEY: string;
  readonly PUBLIC_PODCAST_INDEX_API_SECRET: string;
  readonly PUBLIC_REFLECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type Runtime = import('@astrojs/cloudflare').AdvancedRuntime<ImportMetaEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}
