/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PODCAST_INDEX_API_KEY: string;
  readonly VITE_PODCAST_INDEX_API_SECRET: string;
  readonly VITE_REFLECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
