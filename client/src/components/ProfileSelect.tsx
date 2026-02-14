import "./ProfileSelect.css";

interface ProfileSelectProps {
  onSelect: (profileId: string) => void;
  onLogout: () => void;
  onViewInsights: () => void;
  username: string | null;
}

const profiles = [
  { id: "daddy", label: "Daddy", emoji: "\u{1F468}" },
  { id: "mommy", label: "Mommy", emoji: "\u{1F469}" },
  { id: "tabitha", label: "Tabitha", emoji: "\u{1F467}" },
  { id: "imogen", label: "Imogen", emoji: "\u{1F476}" },
];

export default function ProfileSelect({ onSelect, onLogout, onViewInsights, username }: ProfileSelectProps) {
  return (
    <div className="profile-select">
      <div className="profile-header">
        <h2 className="profile-title">Who are you?</h2>
        <div className="profile-user-info">
          <span className="profile-username">Logged in as: {username}</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
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
      <button
        onClick={onViewInsights}
        className="dashboard-link"
      >
        📊 View Insights
      </button>
    </div>
  );
}
