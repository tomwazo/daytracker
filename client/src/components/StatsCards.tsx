import "./StatsCards.css";

interface StatsCardsProps {
  stats: {
    profileStats: Record<string, { avgScore: number; count: number }>;
    totalEntries: number;
  } | null;
  profileFilter: string;
}

const PROFILE_LABELS: Record<string, string> = {
  daddy: "Daddy",
  mommy: "Mommy",
  tabitha: "Tabitha",
  imogen: "Imogen",
};

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

  // If filtering by profile, show only that profile
  const profilesToShow =
    profileFilter === "all"
      ? Object.keys(profileStats)
      : profileFilter in profileStats
      ? [profileFilter]
      : [];

  return (
    <div className="stats-cards">
      <div className="stat-card total">
        <div className="stat-label">Total Entries</div>
        <div className="stat-value">{totalEntries}</div>
      </div>

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
