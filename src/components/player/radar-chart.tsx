"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  stats: {
    avgTechnique: number;
    avgPhysique: number;
    avgCollectif: number;
  };
  groupAverage?: {
    avgTechnique: number;
    avgPhysique: number;
    avgCollectif: number;
  };
  className?: string;
}

export function PlayerRadarChart({ stats, groupAverage, className }: RadarChartProps) {
  // Prepare data for player
  const playerData = [
    { axis: "Technique", value: Number(stats.avgTechnique) },
    { axis: "Physique", value: Number(stats.avgPhysique) },
    { axis: "Collectif", value: Number(stats.avgCollectif) },
  ];

  // Prepare data for group average (optional overlay)
  const chartData = groupAverage
    ? [
        { axis: "Technique", value: Number(stats.avgTechnique), groupValue: Number(groupAverage.avgTechnique) },
        { axis: "Physique", value: Number(stats.avgPhysique), groupValue: Number(groupAverage.avgPhysique) },
        { axis: "Collectif", value: Number(stats.avgCollectif), groupValue: Number(groupAverage.avgCollectif) },
      ]
    : playerData;

  return (
    <div className={`bg-chalk-pure shadow-card rounded-card p-4 ${className || ""}`}>
      <h3 className="font-semibold mb-4">Répartition des notes</h3>

      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />

          {/* Player data */}
          <Radar
            name="Joueur"
            dataKey="value"
            stroke="#2D5016"
            fill="#2D5016"
            fillOpacity={0.3}
          />

          {/* Group average overlay (optional) */}
          {groupAverage && (
            <Radar
              name="Moyenne groupe"
              dataKey="groupValue"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.2}
            />
          )}

          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
