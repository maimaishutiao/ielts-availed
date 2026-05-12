import React from "react";
import { Card, Empty } from "./UI";

export default function ErrorHeatmap({ data }) {
  if (!data || !data.errors || data.errors.length === 0) {
    return (
      <Card title="高频错误">
        <Empty text="还没有错误数据" />
      </Card>
    );
  }

  const errors = data.errors
    .sort((a, b) => (Number(b.frequency) || 0) - (Number(a.frequency) || 0))
    .slice(0, 10);

  return (
    <Card title={`高频错误 Top ${errors.length}`}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>错误类型</Th>
            <Th>频率</Th>
            <Th>最近出现</Th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e, i) => (
            <tr key={i}>
              <Td>{i + 1}</Td>
              <Td>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    background: "#f43f5e22",
                    color: "#f43f5e",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {e.type}
                </span>
              </Td>
              <Td>{e.frequency}</Td>
              <Td>{e.last_seen || "-"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Th({ children }) {
  return (
    <td
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid #334155",
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: 600,
        textAlign: "left",
      }}
    >
      {children}
    </td>
  );
}

function Td({ children }) {
  return (
    <td
      style={{
        padding: "6px 12px",
        borderBottom: "1px solid #1e293b",
        fontSize: 13,
      }}
    >
      {children}
    </td>
  );
}
