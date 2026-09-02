/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ERP_BASE_URL?: string;
  readonly VITE_ERP_USERNAME?: string;
  readonly VITE_ERP_PASSWORD?: string;
  readonly GEMINI_API_KEY?: string;
  readonly APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
