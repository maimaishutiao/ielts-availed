import React from "react";

export default function Countdown({ config }) {
  if (!config) return null;

  const daysLeft = config.days_left ?? "?";
  const target = config.target || {};
  const examDate = config.exam?.date || config.date || "未设置";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
        borderRadius: 16,
        padding: 32,
        textAlign: "center",
        border: "1px solid #334155",
      }}
    >
      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>
        距离考试
      </div>
      <div style={{ fontSize: 64, fontWeight: 700, color: "#38bdf8" }}>
        {daysLeft}
      </div>
      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
        天
      </div>
      <div style={{ fontSize: 13, color: "#64748b" }}>
        考试日期：{examDate}
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
        目标总分：{target.overall || "?"}
      </div>
    </div>
  );
}
