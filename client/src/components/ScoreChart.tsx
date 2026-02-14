import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Entry {
  profileId: string;
  date: string;
  score: number;
}

interface ScoreChartProps {
  entries: Entry[];
  profileFilter: string;
}

const PROFILE_COLORS = {
  daddy: "#3b82f6",
  mommy: "#ec4899",
  tabitha: "#8b5cf6",
  imogen: "#10b981",
};

const PROFILE_LABELS = {
  daddy: "Daddy",
  mommy: "Mommy",
  tabitha: "Tabitha",
  imogen: "Imogen",
};

export default function ScoreChart({ entries, profileFilter }: ScoreChartProps) {
  if (entries.length === 0) {
    return <div className="chart-empty">No data available for this period.</div>;
  }

  // Group entries by date
  const dateMap: Record<string, any> = {};
  entries.forEach((entry) => {
    if (!dateMap[entry.date]) {
      dateMap[entry.date] = { date: entry.date };
    }
    dateMap[entry.date][entry.profileId] = entry.score;
  });

  const chartData = Object.values(dateMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Determine which profiles to show
  const profiles =
    profileFilter === "all"
      ? ["daddy", "mommy", "tabitha", "imogen"]
      : [profileFilter];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
        <Tooltip
          labelFormatter={(value) => `Date: ${value}`}
          formatter={(value, name) => [
            value ?? 0,
            PROFILE_LABELS[name as keyof typeof PROFILE_LABELS] || name,
          ]}
        />
        <Legend
          formatter={(value) =>
            PROFILE_LABELS[value as keyof typeof PROFILE_LABELS] || value
          }
        />
        {profiles.map((profileId) => (
          <Line
            key={profileId}
            type="monotone"
            dataKey={profileId}
            stroke={PROFILE_COLORS[profileId as keyof typeof PROFILE_COLORS]}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
