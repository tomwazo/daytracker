/**
 * VersionBadge.tsx — Displays the app version in the top-right corner.
 *
 * Shows the Git tag in production (e.g. "v1.4") or "dev" during local
 * development. The __APP_VERSION__ constant is injected at build time
 * by Vite's `define` config (see vite.config.ts). Since the Git tag
 * already includes the "v" prefix, it is displayed as-is.
 *
 * Styled as a subtle, non-interactive overlay via VersionBadge.css.
 */
import "./VersionBadge.css";

export default function VersionBadge() {
  return <span className="version-badge">{__APP_VERSION__}</span>;
}
