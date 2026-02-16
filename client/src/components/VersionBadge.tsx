/**
 * VersionBadge.tsx — Displays the app version in the top-right corner.
 *
 * Shows "v{BUILD_NUMBER}" in production (e.g. "v42") or "vdev" during
 * local development. The __APP_VERSION__ constant is injected at build
 * time by Vite's `define` config (see vite.config.ts).
 *
 * Styled as a subtle, non-interactive overlay via VersionBadge.css.
 */
import "./VersionBadge.css";

export default function VersionBadge() {
  return <span className="version-badge">v{__APP_VERSION__}</span>;
}
