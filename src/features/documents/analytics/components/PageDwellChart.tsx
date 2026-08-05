import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  data: number[];
}

export default function PageDwellChart({ data }: Props) {
  const chartData = data.map((seconds, index) => ({ page: `P${index + 1}`, seconds }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="page" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} label={{ value: "Avg seconds", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#6b7280" } }} />
          <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.08)" }} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(value) => [`${value}s`, "Avg dwell"]} />
          <Bar dataKey="seconds" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}