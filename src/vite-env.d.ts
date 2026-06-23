/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLAUDE_MODEL?: string;
  readonly VITE_AI_MODE?: 'proxy' | 'direct';
  readonly VITE_AI_PROXY_URL?: string;
  readonly VITE_CLAUDE_API_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
