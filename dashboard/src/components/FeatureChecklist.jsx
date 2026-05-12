import React from "react";
import { Card } from "./UI";

const features = [
  { title: "写作记录", detail: "四维评分、错误标签、同义替换", target: "entry", tone: "#38bdf8" },
  { title: "阅读记录", detail: "错题诊断、同义替换、删除记录", target: "entry", tone: "#22c55e" },
  { title: "听力错题分析", detail: "题型追踪 + 精听任务", target: "entry", tone: "#f97316" },
  { title: "进度追踪", detail: "趋势图、雷达图、倒计时", target: "progress", tone: "#a78bfa" },
  { title: "错题本", detail: "错误标签自动聚合", target: "errors", tone: "#fb7185" },
  { title: "同义替换库", detail: "录入后累计，可搜索", target: "synonyms", tone: "#2dd4bf" },
  { title: "备考计划", detail: "按当前数据生成并保存", target: "plan", tone: "#facc15" },
  { title: "词汇进度", detail: "间隔重复词库进度", target: "vocab", tone: "#60a5fa" },
  { title: "导入 / 导出", detail: "JSON 迁移、备份、恢复", target: "backup", tone: "#c084fc" },
];

export default function FeatureChecklist({ onNavigate }) {
  return (
    <Card title="v3.0 功能入口">
      <div style={styles.hero}>
        <div>
          <div style={styles.kicker}>IELTS Workspace</div>
          <div style={styles.heroTitle}>把 README 里的能力放进同一个操作台</div>
        </div>
        <button type="button" onClick={() => onNavigate?.("entry")} style={styles.primaryAction}>
          开始录入
        </button>
      </div>
      <div style={styles.grid}>
        {features.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onNavigate?.(item.target)}
            style={styles.item}
          >
            <span style={{ ...styles.marker, background: item.tone }} />
            <span style={styles.textGroup}>
              <span style={styles.title}>{item.title}</span>
              <span style={styles.detail}>{item.detail}</span>
            </span>
            <span style={styles.arrow}>打开</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

const styles = {
  hero: {
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #12324a 58%, #164e63 100%)",
    border: "1px solid #1f6f8b",
    borderRadius: 8,
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 16,
  },
  kicker: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 1.35,
    marginTop: 5,
  },
  primaryAction: {
    background: "#0ea5e9",
    border: "1px solid #38bdf8",
    borderRadius: 8,
    color: "#f8fafc",
    cursor: "pointer",
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 900,
    padding: "10px 14px",
  },
  grid: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  },
  item: {
    alignItems: "center",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "inherit",
    cursor: "pointer",
    display: "flex",
    gap: 10,
    minHeight: 76,
    padding: 12,
    textAlign: "left",
  },
  marker: {
    borderRadius: 8,
    flexShrink: 0,
    height: 36,
    width: 5,
  },
  textGroup: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
  },
  title: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: 800,
  },
  detail: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 5,
  },
  arrow: {
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#cbd5e1",
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 800,
    padding: "6px 8px",
  },
};
