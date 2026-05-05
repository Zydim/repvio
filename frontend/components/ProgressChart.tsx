"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { HistorySession } from "@/lib/api";

interface Props {
  sessions: HistorySession[];
}

const COLORS = ["#8b5cf6", "#60a5fa", "#34d399", "#f59e0b", "#f87171", "#fb7185"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{d.date} · #{d.index}</p>
      <p className="text-white font-semibold text-sm">{payload[0].value}/100</p>
      <p className="text-zinc-500 mt-0.5">{d.exercise}</p>
    </div>
  );
}

export default function ProgressChart({ sessions }: Props) {
  const exercises = useMemo(() => {
    const unique = [...new Set(sessions.map((s) => s.exercise_type))];
    return unique;
  }, [sessions]);

  const [selected, setSelected] = useState<string>(exercises[0] || "");

  const filtered = useMemo(() => {
    return [...sessions]
      .filter((s) => s.exercise_type === selected)
      .reverse()
      .map((s, i) => ({
        index: i + 1,
        date: new Date(s.created_at).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
        }),
        score: s.score,
        exercise: s.exercise_type,
      }));
  }, [sessions, selected]);

  const avg = useMemo(() => {
    if (!filtered.length) return 0;
    // Ø der letzten 5 Sessions — zeigt aktuelles Niveau, nicht historischen Schnitt
    const recent = filtered.slice(-5);
    return Math.round(recent.reduce((sum, s) => sum + s.score, 0) / recent.length);
  }, [filtered]);

  const color = COLORS[exercises.indexOf(selected) % COLORS.length];

  if (sessions.length < 2) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-300">Fortschritt</h2>
          {filtered.length > 0 && (
            <p className="text-xs text-zinc-500 mt-0.5">
              Ø letzte 5: <span className="text-zinc-300 font-medium">{avg}/100</span>
            </p>
          )}
        </div>

        {/* Exercise Filter */}
        <div className="flex flex-wrap gap-2">
          {exercises.map((ex, i) => (
            <button
              key={ex}
              onClick={() => setSelected(ex)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                selected === ex
                  ? "border-transparent text-white"
                  : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
              }`}
              style={selected === ex ? { backgroundColor: COLORS[i % COLORS.length], boxShadow: `0 0 12px ${COLORS[i % COLORS.length]}55` } : {}}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {filtered.length < 2 ? (
        <p className="text-zinc-500 text-sm text-center py-8">
          Mindestens 2 Analysen für {selected} nötig.
        </p>
      ) : (
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="index"
                tickFormatter={(v) => {
                  const point = filtered[v - 1];
                  return point ? point.date : "";
                }}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={avg}
                stroke="#52525b"
                strokeDasharray="4 4"
                label={{ value: `Ø ${avg}`, fill: "#71717a", fontSize: 10, position: "right" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={color}
                strokeWidth={2.5}
                dot={{ fill: color, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
