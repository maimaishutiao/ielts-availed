import React, { useState, useMemo } from "react";
import { Card, Empty } from "./UI";

export default function SynonymLib({ data }) {
  const [search, setSearch] = useState("");

  const synonyms = useMemo(() => {
    if (!data) return [];
    const rows = data.rows || [];
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.question && r.question.toLowerCase().includes(q)) ||
        (r.replacement && r.replacement.toLowerCase().includes(q)) ||
        (r.source && r.source.toLowerCase().includes(q))
    );
  }, [data, search]);

  if (!data) {
    return (
      <Card title="同义替换累计库">
        <Empty text="还没有数据" />
      </Card>
    );
  }

  return (
    <Card title={`同义替换累计库（${synonyms.length} 对）`}>
      <input
        type="text"
        placeholder="搜索单词..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          color: "#e2e8f0",
          fontSize: 14,
          marginBottom: 16,
          outline: "none",
        }}
      />
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>题目用词</Th>
              <Th>替换词</Th>
              <Th>来源</Th>
              <Th>日期</Th>
            </tr>
          </thead>
          <tbody>
            {synonyms.map((s, i) => (
              <tr key={i}>
                <Td>{s.question}</Td>
                <Td>{s.replacement}</Td>
                <Td>{s.source}</Td>
                <Td>{s.date}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
