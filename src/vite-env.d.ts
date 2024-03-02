/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_PODCAST_INDEX_API_KEY: string;
  readonly PUBLIC_PODCAST_INDEX_API_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
