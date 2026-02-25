/// <reference types="vite/client" />

// Custom VITE_ environment variables used by the application.
// These must start with VITE_ to be exposed to the browser bundle.
interface ImportMetaEnv {
  /**
   * Set to '1' by the Playwright webServer to collapse all battle victory
   * animation delays to 0ms.  Never set in production or normal development.
   */
  readonly VITE_E2E_FAST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
