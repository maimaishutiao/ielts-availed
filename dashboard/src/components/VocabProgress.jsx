import React from "react";
import { Card, Empty } from "./UI";

export default function VocabProgress({ data }) {
  if (!data) {
    return (
      <Card title="词汇进度">
        <Empty text="还没有词库数据" />
      </Card>
    );
  }

  const total = data.total || 0;

  return (
    <Card title={`词汇进度（${total} 词）`}>
      <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
        <StatBox label="词库总量" value={total} color="#38bdf8" />
        <StatBox label="今日待复习" value={data.due_today || 0} color="#f97316" />
      </div>
      {total === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: 13,
            marginTop: 16,
          }}
        >
          运行 /ielts-vocab 添加单词
        </div>
      )}
    </Card>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
