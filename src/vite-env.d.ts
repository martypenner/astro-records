/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PODCAST_INDEX_API_KEY: string;
  readonly VITE_PODCAST_INDEX_API_SECRET: string;
  readonly PARTYKIT_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
