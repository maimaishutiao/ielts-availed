import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, Empty } from "./UI";

export default function ReadingStats({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card title="阅读正确率趋势">
        <Empty text="还没有阅读数据" />
      </Card>
    );
  }

  return (
    <Card title={`阅读正确率趋势（共 ${data.length} 次）`}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis
            yAxisId="score"
            domain={[4, 9]}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            yAxisId="rate"
            orientation="right"
            domain={[0, 100]}
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
            }}
          />
          <Line
            yAxisId="score"
            type="monotone"
            dataKey="Score"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="Rate"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
