import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, Empty } from "./UI";

export default function RadarChartComponent({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card title="四科雷达图">
        <Empty text="还没有训练数据" />
      </Card>
    );
  }

  return (
    <Card title="四科雷达图（当前 vs 目标）">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={13} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 9]}
            stroke="#475569"
            fontSize={11}
          />
          <Radar
            name="目标"
            dataKey="target"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name="当前"
            dataKey="current"
            stroke="#f43f5e"
            fill="#f43f5e"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
}
