/**
 * WordFrequencyChart.tsx — Bar chart showing how often each word is used.
 *
 * Displays a horizontal-category bar chart using Recharts where each bar
 * represents a word and its height is the usage count. The parent component
 * (Dashboard) slices the data to the top 20 words before passing it in.
 *
 * Uses a purple fill colour (#8b5cf6) to visually distinguish it from
 * the line chart's per-profile colours.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/** Shape of a single word frequency data point */
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
