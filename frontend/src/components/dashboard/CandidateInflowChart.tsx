"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const series = {
  applicants: months.map((m, i) => ({ name: m, v: 12 + i * 4 + (i % 3) * 3 })),
  screened: months.map((m, i) => ({ name: m, v: 8 + i * 3 + (i % 4) * 2 })),
  shortlisted: months.map((m, i) => ({ name: m, v: 2 + Math.floor(i * 0.8) + (i % 2) })),
} as const;

type Tab = keyof typeof series;

export function CandidateInflowChart() {
  const [tab, setTab] = useState<Tab>("applicants");
  const data = series[tab];

  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Candidate inflow</h3>
          <p className="text-sm text-text-muted">Applications and screening volume over the year</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "applicants" as const, label: "Applicants" },
              { id: "screened" as const, label: "Screened" },
              { id: "shortlisted" as const, label: "Shortlisted" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                tab === t.id
                  ? "rounded-badge border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                  : "rounded-badge border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-border hover:text-text-primary"
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="inflowFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="v"
              name={tab === "applicants" ? "Applicants" : tab === "screened" ? "Screened" : "Shortlisted"}
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#inflowFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
