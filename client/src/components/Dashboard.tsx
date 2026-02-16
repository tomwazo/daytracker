import { useState, useEffect } from "react";
import { subDays, format } from "date-fns";
import ScoreChart from "./ScoreChart";
import WordFrequencyChart from "./WordFrequencyChart";
import StatsCards from "./StatsCards";
import "./Dashboard.css";

interface DashboardProps {
  onBack: () => void;
}

type DatePreset = "7d" | "30d" | "90d" | "all";

const PROFILES = [
  { id: "all", label: "All Family Members" },
  { id: "daddy", label: "Daddy" },
  { id: "mommy", label: "Mommy" },
  { id: "tabitha", label: "Tabitha" },
  { id: "imogen", label: "Imogen" },
];

export default function Dashboard({ onBack }: DashboardProps) {
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [entries, setEntries] = useState<any[]>([]);
  const [wordFrequency, setWordFrequency] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on preset
  useEffect(() => {
    const today = new Date();
    const end = format(today, "yyyy-MM-dd");
    let start: string;

    switch (datePreset) {
      case "7d":
        start = format(subDays(today, 7), "yyyy-MM-dd");
        break;
      case "30d":
        start = format(subDays(today, 30), "yyyy-MM-dd");
        break;
      case "90d":
        start = format(subDays(today, 90), "yyyy-MM-dd");
        break;
      case "all":
        start = "2020-01-01"; // Far enough back to get all data
        break;
    }

    setStartDate(start);
    setEndDate(end);
  }, [datePreset]);

  // Fetch data when date range or profile filter changes
  useEffect(() => {
    if (!startDate || !endDate) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const profileParam = profileFilter === "all" ? "" : `&profileId=${profileFilter}`;

        // Fetch entries
        const entriesRes = await fetch(
          `/api/analytics/entries?startDate=${startDate}&endDate=${endDate}${profileParam}`
        );
        // Redirect to login if session expired, or show access denied
        if (entriesRes.status === 401) { window.location.href = "/.auth/login/aad"; return; }
        if (entriesRes.status === 403) throw new Error("Access denied. Your account is not authorised.");
        if (!entriesRes.ok) throw new Error("Failed to fetch entries");
        const entriesData = await entriesRes.json();

        // Fetch word frequency
        const wordFreqRes = await fetch(
          `/api/analytics/word-frequency?startDate=${startDate}&endDate=${endDate}${profileParam}`
        );
        if (wordFreqRes.status === 401) { window.location.href = "/.auth/login/aad"; return; }
        if (wordFreqRes.status === 403) throw new Error("Access denied. Your account is not authorised.");
        if (!wordFreqRes.ok) throw new Error("Failed to fetch word frequency");
        const wordFreqData = await wordFreqRes.json();

        // Fetch stats
        const statsRes = await fetch(
          `/api/analytics/stats?startDate=${startDate}&endDate=${endDate}`
        );
        if (statsRes.status === 401) { window.location.href = "/.auth/login/aad"; return; }
        if (statsRes.status === 403) throw new Error("Access denied. Your account is not authorised.");
        if (!statsRes.ok) throw new Error("Failed to fetch stats");
        const statsData = await statsRes.json();

        setEntries(entriesData);
        setWordFrequency(wordFreqData);
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        // Show the specific error message (e.g. "Access denied") if available
        const message = err instanceof Error ? err.message : "Failed to load dashboard data. Please try again.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [startDate, endDate, profileFilter]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h1>Insights & Analytics</h1>
      </div>

      <div className="dashboard-controls">
        <div className="control-group">
          <label>Time Period:</label>
          <div className="preset-buttons">
            <button
              className={datePreset === "7d" ? "active" : ""}
              onClick={() => setDatePreset("7d")}
            >
              Last 7 days
            </button>
            <button
              className={datePreset === "30d" ? "active" : ""}
              onClick={() => setDatePreset("30d")}
            >
              Last 30 days
            </button>
            <button
              className={datePreset === "90d" ? "active" : ""}
              onClick={() => setDatePreset("90d")}
            >
              Last 90 days
            </button>
            <button
              className={datePreset === "all" ? "active" : ""}
              onClick={() => setDatePreset("all")}
            >
              All time
            </button>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="profile-filter">Profile:</label>
          <select
            id="profile-filter"
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
          >
            {PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="dashboard-loading">Loading dashboard data...</div>
      )}

      {error && <div className="dashboard-error">{error}</div>}

      {!loading && !error && (
        <>
          <StatsCards stats={stats} profileFilter={profileFilter} />

          <div className="dashboard-charts">
            <div className="chart-section">
              <h2>Scores Over Time</h2>
              <ScoreChart entries={entries} profileFilter={profileFilter} />
            </div>

            <div className="chart-section">
              <h2>Top Words</h2>
              <WordFrequencyChart wordFrequency={wordFrequency.slice(0, 20)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
