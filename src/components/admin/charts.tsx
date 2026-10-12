"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEGP } from "@/lib/format";

const PINK = "var(--pink-ink)";
const tick = { fill: "#7a5a55", fontSize: 12 };

type Point = { label: string; value: number };

export function BarsChart({ data, money = false, height = 240, color = PINK, label }: { data: Point[]; money?: boolean; height?: number; color?: string; label: string }) {
  const empty = data.every((d) => d.value === 0);
  return (
    <figure aria-label={label}>
      <div style={{ height }} className="relative">
        {empty && <p className="absolute inset-0 z-10 grid place-items-center text-sm font-semibold text-cocoa-muted">No data yet</p>}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f0e1da" />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
            <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} width={money ? 56 : 36} tickFormatter={(v) => (money ? (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v)) : String(v))} />
            <Tooltip cursor={{ fill: "rgba(199,36,116,0.06)" }} formatter={(v) => [money ? formatEGP(Number(v)) : String(v), money ? "Verified sales" : "Orders"]} contentStyle={{ borderRadius: 14, border: "1px solid #f0e1da" }} />
            <Bar dataKey="value" isAnimationActive={false} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{data.map((d) => `${d.label}: ${money ? formatEGP(d.value) : d.value}`).join(", ")}</figcaption>
    </figure>
  );
}

export function HBarsChart({ data, label, colors }: { data: Point[]; label: string; colors?: string[] }) {
  if (data.length === 0) return <p className="py-10 text-center text-sm font-semibold text-cocoa-muted">No data yet</p>;
  return (
    <figure aria-label={label}>
      <div style={{ height: Math.max(160, data.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={tick} tickLine={false} axisLine={false} width={130} />
            <Tooltip cursor={{ fill: "rgba(199,36,116,0.06)" }} formatter={(v) => [String(v), "Count"]} contentStyle={{ borderRadius: 14, border: "1px solid #f0e1da" }} />
            <Bar dataKey="value" isAnimationActive={false} radius={[0, 6, 6, 0]} maxBarSize={26} label={{ position: "right", fill: "#4b2925", fontSize: 12 }}>
              {data.map((_, i) => <Cell key={i} fill={colors?.[i] ?? PINK} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{data.map((d) => `${d.label}: ${d.value}`).join(", ")}</figcaption>
    </figure>
  );
}
