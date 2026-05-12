import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, Empty } from "./UI";

export default function ScoreTrend({ data, target }) {
  if (!data || data.length === 0) {
    return (
      <Card title="写作分数趋势">
        <Empty text="还没有写作数据" />
      </Card>
    );
  }

  return (
    <Card title="写作分数趋势">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis domain={[4, 9]} stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="TR"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="CC"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="LR"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="GRA"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="Overall"
            stroke="#f43f5e"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {target && (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
          目标：{target}
        </div>
      )}
    </Card>
  );
}
