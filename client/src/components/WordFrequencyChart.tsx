import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WordFrequency {
  word: string;
  count: number;
}

interface WordFrequencyChartProps {
  wordFrequency: WordFrequency[];
}

export default function WordFrequencyChart({
  wordFrequency,
}: WordFrequencyChartProps) {
  if (wordFrequency.length === 0) {
    return <div className="chart-empty">No words found for this period.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={wordFrequency}
        layout="horizontal"
        margin={{ left: 20, right: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="category" dataKey="word" tick={{ fontSize: 12 }} />
        <YAxis type="number" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#8b5cf6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
