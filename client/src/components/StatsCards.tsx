/**
 * StatsCards.tsx — Summary statistics cards for the Dashboard.
 *
 * Displays a grid of cards showing:
 *   - A "Total Entries" card with a gradient background
 *   - One card per profile with their emoji, average score, and entry count
 *
 * When a profile filter is active, only that profile's card is shown
 * alongside the total. When "all" is selected, every profile with data
 * gets a card.
 */
import "./StatsCards.css";

interface StatsCardsProps {
  stats: {
    profileStats: Record<string, { avgScore: number; count: number }>;
    totalEntries: number;
  } | null;
  profileFilter: string;
}

/** Human-readable display names for each profile */
const PROFILE_LABELS: Record<string, string> = {
  daddy: "Daddy",
  mommy: "Mommy",
  tabitha: "Tabitha",
  imogen: "Imogen",
};

/** Emoji avatars matching each profile */
const PROFILE_EMOJIS: Record<string, string> = {
  daddy: "👨",
  mommy: "👩",
  tabitha: "👧",
  imogen: "👶",
};

export default function StatsCards({ stats, profileFilter }: StatsCardsProps) {
  if (!stats) {
    return null;
  }

  const { profileStats, totalEntries } = stats;

  // Show all profiles or just the filtered one
  const profilesToShow =
    profileFilter === "all"
      ? Object.keys(profileStats)
      : profileFilter in profileStats
      ? [profileFilter]
      : [];

  return (
    <div className="stats-cards">
      {/* Grand total card with gradient background */}
      <div className="stat-card total">
        <div className="stat-label">Total Entries</div>
        <div className="stat-value">{totalEntries}</div>
      </div>

      {/* Per-profile stat cards */}
      {profilesToShow.map((profileId) => {
        const stat = profileStats[profileId];
        if (!stat) return null;

        return (
          <div key={profileId} className="stat-card">
            <div className="stat-icon">
              {PROFILE_EMOJIS[profileId] || "👤"}
            </div>
            <div className="stat-info">
              <div className="stat-label">{PROFILE_LABELS[profileId]}</div>
              <div className="stat-value">
                {stat.avgScore.toFixed(1)}
                <span className="stat-unit">/10</span>
              </div>
              <div className="stat-meta">{stat.count} entries</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
