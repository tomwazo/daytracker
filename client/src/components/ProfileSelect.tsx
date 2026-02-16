/**
 * ProfileSelect.tsx — Landing page with a 2x2 grid of family member profiles.
 *
 * Each profile is displayed as a card with an emoji and name. Clicking a
 * card navigates to that member's DayEntry form. Below the grid, a
 * "View Insights" button navigates to the analytics Dashboard.
 *
 * Profile selection is trust-based — there are no passwords per profile.
 * Authentication is handled at the Azure SWA level (Microsoft login).
 */
import "./ProfileSelect.css";

interface ProfileSelectProps {
  onSelect: (profileId: string) => void;
  onViewInsights: () => void;
}

/** The four family members with their display names and emoji avatars */
const profiles = [
  { id: "daddy", label: "Daddy", emoji: "\u{1F468}" },
  { id: "mommy", label: "Mommy", emoji: "\u{1F469}" },
  { id: "tabitha", label: "Tabitha", emoji: "\u{1F467}" },
  { id: "imogen", label: "Imogen", emoji: "\u{1F476}" },
];

export default function ProfileSelect({ onSelect, onViewInsights }: ProfileSelectProps) {
  return (
    <div className="profile-select">
      <div className="profile-header">
        <h2 className="profile-title">Who are you?</h2>
      </div>
      {/* 2x2 grid of profile cards */}
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
      {/* Navigation to the analytics dashboard */}
      <button
        onClick={onViewInsights}
        className="dashboard-link"
      >
        View Insights
      </button>
    </div>
  );
}
