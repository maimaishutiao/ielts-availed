import React, { useMemo, useState } from "react";
import { Card } from "./UI";
import {
  aggregateWritingScores,
  aggregateReadingScores,
  aggregateListeningScores,
} from "../utils/aggregator";

export default function DiagnosisPlan({
  config,
  writing,
  reading,
  listening,
  speaking,
  errors,
  plan,
  onSaved,
}) {
  const [status, setStatus] = useState("");
  const diagnosis = useMemo(
    () => buildDiagnosis({ config, writing, reading, listening, speaking, errors }),
    [config, writing, reading, listening, speaking, errors]
  );

  async function savePlan() {
    setStatus("保存中...");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diagnosis),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败");
      setStatus(result.message || "计划已保存。");
      await onSaved?.();
    } catch (error) {
      setStatus(error.message || "保存失败");
    }
  }

  return (
    <Card title="诊断与备考计划">
      <div style={styles.summaryGrid}>
        {diagnosis.scores.map((item) => (
          <div key={item.name} style={styles.scoreBox}>
            <div style={styles.scoreName}>{item.name}</div>
            <div style={styles.scoreValue}>{item.current}</div>
            <div style={styles.scoreMeta}>目标 {item.target} · 差距 {item.gap}</div>
          </div>
        ))}
      </div>

      <div style={styles.block}>
        <div style={styles.blockTitle}>优先级</div>
        {diagnosis.priorities.map((item) => (
          <div key={item} style={styles.row}>{item}</div>
        ))}
      </div>

      <div style={styles.block}>
        <div style={styles.blockTitle}>7 天训练安排</div>
        {diagnosis.tasks.map((item) => (
          <div key={item} style={styles.row}>{item}</div>
        ))}
      </div>

      {plan?.last_updated && (
        <div style={styles.saved}>上次保存：{plan.last_updated}</div>
      )}
      <button type="button" onClick={savePlan} style={styles.button}>
        保存当前诊断计划
      </button>
      {status && <div style={styles.status}>{status}</div>}
    </Card>
  );
}

function buildDiagnosis({ config, writing, reading, listening, speaking, errors }) {
  const writingAgg = aggregateWritingScores(writing);
  const readingAgg = aggregateReadingScores(reading);
  const listeningAgg = aggregateListeningScores(listening);
  const target = config?.target || {};
  const scores = [
    {
      key: "listening",
      name: "听力",
      current: listeningAgg.latest?.score || 0,
      target: target.listening || 0,
    },
    {
      key: "reading",
      name: "阅读",
      current: readingAgg.latest?.score || 0,
      target: target.reading || 0,
    },
    {
      key: "writing",
      name: "写作",
      current: writingAgg.latest?.overall || 0,
      target: target.writing || 0,
    },
    {
      key: "speaking",
      name: "口语",
      current: speaking?.length ? "已建素材" : 0,
      target: target.speaking || 0,
      numericCurrent: 0,
    },
  ].map((item) => {
    const current = Number(item.numericCurrent ?? item.current) || 0;
    const gap = Math.max(0, Number(item.target || 0) - current);
    return { ...item, gap: Math.round(gap * 10) / 10 };
  });

  const weak = [...scores].sort((a, b) => b.gap - a.gap).filter((item) => item.gap > 0);
  const topErrors = (errors?.errors || [])
    .sort((a, b) => (Number(b.frequency) || 0) - (Number(a.frequency) || 0))
    .slice(0, 3)
    .map((item) => item.type);
  const priorities = [
    ...(weak.length ? weak.slice(0, 2).map((item) => `优先补 ${item.name}，距离目标还差 ${item.gap} 分。`) : ["四科距离目标差距不大，保持频率并补薄弱题型。"]),
    ...(topErrors.length ? [`高频错误先处理：${topErrors.join("、")}。`] : ["还没有错题标签，建议每次记录时填写错误标签。"]),
  ];
  const tasks = [
    "写作：每 2 天完成 1 篇并记录 TR / CC / LR / GRA。",
    "阅读：每次记录错题类型和同义替换，复盘定位句。",
    "听力：按题型追踪错误，并安排 15 分钟精听任务。",
    "词汇：把阅读/听力/写作里的同义替换加入累计库。",
  ];

  return {
    scores,
    priorities,
    tasks,
  };
}

const styles = {
  summaryGrid: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  },
  scoreBox: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: 12,
  },
  scoreName: { color: "#94a3b8", fontSize: 12 },
  scoreValue: { color: "#38bdf8", fontSize: 24, fontWeight: 800, marginTop: 4 },
  scoreMeta: { color: "#64748b", fontSize: 12, marginTop: 4 },
  block: { marginTop: 16 },
  blockTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: 800, marginBottom: 8 },
  row: { color: "#cbd5e1", fontSize: 13, lineHeight: 1.6, marginBottom: 4 },
  saved: { color: "#64748b", fontSize: 12, marginTop: 14 },
  button: {
    background: "#0ea5e9",
    border: "1px solid #38bdf8",
    borderRadius: 8,
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    marginTop: 14,
    padding: "9px 12px",
  },
  status: { color: "#bbf7d0", fontSize: 13, marginTop: 10 },
};
