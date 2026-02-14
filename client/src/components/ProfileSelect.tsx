import "./ProfileSelect.css";

interface ProfileSelectProps {
  onSelect: (profileId: string) => void;
}

const profiles = [
  { id: "daddy", label: "Daddy", emoji: "\u{1F468}" },
  { id: "mommy", label: "Mommy", emoji: "\u{1F469}" },
  { id: "tabitha", label: "Tabitha", emoji: "\u{1F467}" },
  { id: "imogen", label: "Imogen", emoji: "\u{1F476}" },
];

const GRAFANA_URL = "http://localhost:3000";

export default function ProfileSelect({ onSelect }: ProfileSelectProps) {
  return (
    <div className="profile-select">
      <h2 className="profile-title">Who are you?</h2>
      <div className="profile-grid">
        {profiles.map((p) => (
          <button
            key={p.id}
            className="profile-card"
            onClick={() => onSelect(p.id)}
          >
            <span className="profile-emoji">{p.emoji}</span>
            <span className="profile-name">{p.label}</span>
          </button>
        ))}
      </div>
      <a
        href={GRAFANA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="dashboard-link"
      >
        View Dashboards
      </a>
    </div>
  );
}
