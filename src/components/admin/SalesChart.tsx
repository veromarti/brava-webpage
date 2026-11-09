"use client";

import { useId, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";

export interface SalesChartPoint {
  label: string;
  value: number;
}

interface SalesChartProps {
  title: string;
  points: SalesChartPoint[];
  formatValue: (value: number) => string;
  emptyMessage?: string;
}

// Rounds up to a "nice" number (1/2/5 × 10^n) so the gridlines read as clean
// values (0 / 2,000 / 4,000) instead of whatever the raw max happens to be.
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

// Single-hue bar chart over time — revenue and order count get their own
// instance each rather than sharing an axis (two measures of different
// scale on one y-axis misleads at a glance). No legend: one series needs
// none, the card title already says what's plotted.
export function SalesChart({ title, points, formatValue, emptyMessage = "Sin datos en este período." }: SalesChartProps) {
  const [showTable, setShowTable] = useState(false);
  const captionId = useId();

  const max = Math.max(1, ...points.map((p) => p.value));
  const axisMax = niceCeil(max);
  const ticks = [axisMax, axisMax / 2, 0];

  // Showing every label past ~6 bars collides; thin them out to roughly 6
  // evenly-spaced labels and always keep the last one so the range's most
  // recent period is legible. Lower than the bar count because each label
  // is centered on its bar (see below) — neighbors need breathing room,
  // not just their own narrow column.
  const labelStride = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="rounded-2xl border border-brava-pink-light p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 id={captionId} className="text-sm font-medium text-brava-ink">
          {title}
        </h3>
        {points.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="flex items-center gap-1 text-xs text-brava-muted hover:text-brava-pink-dark"
          >
            {showTable ? "Ver gráfico" : "Ver como tabla"}
            <FaChevronDown aria-hidden className={`transition-transform ${showTable ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {points.length === 0 ? (
        <p className="mt-6 text-sm text-brava-muted">{emptyMessage}</p>
      ) : showTable ? (
        <div className="mt-4 max-h-56 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brava-pink-light text-brava-muted">
                <th className="py-1.5 font-medium">Período</th>
                <th className="py-1.5 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i} className="border-b border-brava-pink-light/50">
                  <td className="py-1.5 text-brava-muted">{p.label}</td>
                  <td className="py-1.5 text-brava-ink">{formatValue(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 flex gap-2" aria-labelledby={captionId}>
          <div className="flex h-44 w-10 shrink-0 flex-col justify-between text-right text-xs text-brava-muted">
            {ticks.map((t, i) => (
              <span key={i}>{formatValue(t)}</span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 pb-5">
            <div className="absolute inset-x-0 top-0 flex h-44 flex-col justify-between">
              {ticks.map((t, i) => (
                <div key={i} className={i === ticks.length - 1 ? "border-t border-brava-pink-light" : "border-t border-brava-pink-light/40"} />
              ))}
            </div>
            <div className="relative flex h-44 items-end gap-0.5">
              {points.map((p, i) => {
                const heightPercent = (p.value / axisMax) * 100;
                const showLabel = i === points.length - 1 || i % labelStride === 0;
                return (
                  <div key={i} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    <div
                      tabIndex={0}
                      className="w-full max-w-6 rounded-t bg-brava-pink outline-none transition-colors group-hover:bg-brava-pink-dark focus-visible:bg-brava-pink-dark"
                      style={{ height: `${heightPercent}%`, minHeight: p.value > 0 ? 2 : 0 }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brava-ink px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <span className="font-medium">{formatValue(p.value)}</span>
                      <span className="ml-1 text-white/70">{p.label}</span>
                    </div>
                    {/* Positioned absolute, not in normal flow — so the label's
                        own width (which can be wider than this narrow column
                        once there are many bars) never forces the column,
                        and therefore the whole chart, to widen or truncate
                        mid-word. */}
                    {showLabel && (
                      <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-brava-muted">
                        {p.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
