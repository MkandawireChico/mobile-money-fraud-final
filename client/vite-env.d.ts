/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_ENV: 'development' | 'production' | 'test';
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
