import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDuration } from "../lib/formatDuration";

interface Props {
  data: number[];
}

const HORIZONTAL_THRESHOLD = 10;

export default function PageDwellChart({ data }: Props) {
  const chartData = data.map((seconds, index) => ({
    page: `P${index + 1}`,
    seconds,
  }));

  const isHorizontal = chartData.length > HORIZONTAL_THRESHOLD;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 8, left: isHorizontal ? 48 : -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            {...(isHorizontal ? { vertical: false } : { horizontal: false })}
          />
          <XAxis
            dataKey={isHorizontal ? "seconds" : "page"}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            type={isHorizontal ? "number" : "category"}
            tickFormatter={isHorizontal ? (value) => formatDuration(value) : undefined}
          />
          {isHorizontal ? (
            <YAxis
              dataKey="page"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              type="category"
            />
          ) : (
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatDuration(value)}
              label={{
                value: "Avg time",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#6b7280" },
              }}
            />
          )}
          <Tooltip
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(value) => [formatDuration(Number(value) || 0), "Avg dwell"]}
          />
          <Bar
            dataKey="seconds"
            fill="#6366f1"
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}