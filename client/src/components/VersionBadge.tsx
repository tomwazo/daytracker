import "./VersionBadge.css";

export default function VersionBadge() {
  return <span className="version-badge">v{__APP_VERSION__}</span>;
}
