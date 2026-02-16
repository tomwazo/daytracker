/// <reference types="vite/client" />

/**
 * Global constant injected by Vite at build time via the `define` config.
 * In production, this is the Git tag name (e.g. "v1.4").
 * In local development, this defaults to "dev".
 * Used by VersionBadge to display the current app version.
 */
declare const __APP_VERSION__: string;
