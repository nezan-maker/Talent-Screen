"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Umurava", value: 38, color: "#10B981" },
  { name: "Referral", value: 26, color: "#06B6D4" },
  { name: "Company site", value: 22, color: "#3B82F6" },
  { name: "LinkedIn", value: 14, color: "#8B5CF6" },
];

export function ApplicationSourcesChart() {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-text-primary">Application sources</h3>
      <p className="text-sm text-text-muted">
        Where candidates entered your pipeline (sample: {total}% total)
      </p>
      <div className="mt-2 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="40%"
              cy="50%"
              innerRadius={56}
              outerRadius={76}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 12, paddingLeft: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
