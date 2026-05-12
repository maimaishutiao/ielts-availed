import React, { useState } from "react";

const workflows = [
  {
    id: "config",
    label: "目标设置",
    submitLabel: "保存目标",
    fields: [
      { key: "overall", label: "目标总分", placeholder: "7", type: "number" },
      { key: "listening", label: "听力目标", placeholder: "7.5", type: "number" },
      { key: "reading", label: "阅读目标", placeholder: "7.5", type: "number" },
      { key: "writing", label: "写作目标", placeholder: "6.5", type: "number" },
      { key: "speaking", label: "口语目标", placeholder: "6.5", type: "number" },
      { key: "examDate", label: "考试日期", placeholder: "2026-08-24", type: "date" },
      { key: "focus", label: "当前重点", placeholder: "writing" },
    ],
  },
  {
    id: "writing",
    label: "写作记录",
    submitLabel: "保存作文",
    fields: [
      { key: "task", label: "Task", options: [["task2", "Task 2"], ["task1", "Task 1"]] },
      { key: "questionType", label: "题型", placeholder: "opinion" },
      { key: "target", label: "目标分", placeholder: "6.5", type: "number" },
      { key: "tr", label: "TR", placeholder: "6", type: "number" },
      { key: "cc", label: "CC", placeholder: "6", type: "number" },
      { key: "lr", label: "LR", placeholder: "6", type: "number" },
      { key: "gra", label: "GRA", placeholder: "6", type: "number" },
      { key: "question", label: "题目", multiline: true, placeholder: "粘贴 Task 1 / Task 2 题目" },
      { key: "essay", label: "作文", multiline: true, placeholder: "粘贴你的作文" },
      { key: "notes", label: "问题和改进", multiline: true, placeholder: "写下本次主要问题、改进建议或老师反馈" },
      { key: "errorTags", label: "错误标签", multiline: true, placeholder: "每行一个错误，例如：审题偏差、语法时态、词汇重复" },
      { key: "synonyms", label: "同义替换", multiline: true, placeholder: "每行一组：题目用词 => 高分替换" },
    ],
  },
  {
    id: "reading",
    label: "阅读记录",
    submitLabel: "保存阅读",
    fields: [
      { key: "passage", label: "文章标题", placeholder: "Cambridge 18 Test 1 Passage 2" },
      { key: "correct", label: "正确题数", placeholder: "28", type: "number" },
      { key: "total", label: "总题数", placeholder: "40", type: "number" },
      { key: "score", label: "分数", placeholder: "6.5", type: "number" },
      { key: "questions", label: "错题 / 题目", multiline: true, placeholder: "记录题号、题型和你的答案" },
      { key: "notes", label: "错因和同义替换", multiline: true, placeholder: "写下错因、定位句、同义替换" },
      { key: "errorTags", label: "错误标签", multiline: true, placeholder: "每行一个错误，例如：定位失败、T/F/NG 判断、同义替换没看出" },
      { key: "synonyms", label: "同义替换", multiline: true, placeholder: "每行一组：题目用词 => 原文用词" },
    ],
  },
  {
    id: "listening",
    label: "听力记录",
    submitLabel: "保存听力",
    fields: [
      { key: "section", label: "Section", options: [["full", "Full"], ["section1", "Section 1"], ["section2", "Section 2"], ["section3", "Section 3"], ["section4", "Section 4"]] },
      { key: "correct", label: "正确题数", placeholder: "30", type: "number" },
      { key: "total", label: "总题数", placeholder: "40", type: "number" },
      { key: "score", label: "分数", placeholder: "7", type: "number" },
      { key: "questionTypes", label: "题型追踪", multiline: true, placeholder: "例如：地图题 2 错 1；填空题 10 错 3" },
      { key: "mistakes", label: "错题", multiline: true, placeholder: "记录题号、你的答案、正确答案" },
      { key: "notes", label: "错因 / 精听任务", multiline: true, placeholder: "例如：同义替换没听出、数字拼写错误" },
      { key: "intensiveTask", label: "精听任务", multiline: true, placeholder: "例如：Section 3 12:30-14:10 跟读三遍，标出转折词" },
      { key: "errorTags", label: "错误标签", multiline: true, placeholder: "每行一个错误，例如：数字拼写、同义替换、连读弱读" },
      { key: "synonyms", label: "听力同义替换", multiline: true, placeholder: "每行一组：听到的表达 => 题目表达" },
    ],
  },
  {
    id: "speaking",
    label: "口语素材",
    submitLabel: "保存素材",
    fields: [
      { key: "topic", label: "话题", placeholder: "Describe a person who helped you" },
      { key: "storyGroup", label: "故事组", placeholder: "helpful person" },
      { key: "content", label: "素材内容", multiline: true, placeholder: "写下 Part 2 素材、关键词或完整答案" },
    ],
  },
  {
    id: "vocab",
    label: "词汇记录",
    submitLabel: "保存词汇",
    fields: [
      { key: "words", label: "单词 / 短语", multiline: true, placeholder: "每行一个词或短语" },
      { key: "context", label: "使用场景", placeholder: "Task 2 教育类 / 阅读同义替换" },
    ],
  },
];

const initialValues = workflows.reduce((acc, workflow) => {
  acc[workflow.id] = workflow.fields.reduce((fields, field) => {
    fields[field.key] = field.options?.[0]?.[0] || "";
    return fields;
  }, {});
  return acc;
}, {});

export default function SkillPromptBuilder({ onSubmitted, records = {} }) {
  const [activeId, setActiveId] = useState(workflows[0].id);
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState({ type: "idle", text: "" });

  const active = workflows.find((workflow) => workflow.id === activeId);
  const activeRecords = getRecords(activeId, records);

  function updateField(key, value) {
    setValues((current) => ({
      ...current,
      [active.id]: {
        ...current[active.id],
        [key]: value,
      },
    }));
    setStatus({ type: "idle", text: "" });
  }

  async function submitForm(event) {
    event.preventDefault();
    setStatus({ type: "saving", text: "保存中..." });

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: active.id,
          values: values[active.id],
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "保存失败");
      }

      setStatus({ type: "success", text: result.message || "已保存，下面的数据已更新。" });
      await onSubmitted?.();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存失败" });
    }
  }

  async function deleteRecord(record) {
    const label = getRecordTitle(activeId, record);
    const confirmed = window.confirm(`确定删除这条记录吗？\n${label}`);
    if (!confirmed) return;

    setStatus({ type: "saving", text: "删除中..." });
    try {
      const response = await fetch("/api/records", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeId,
          file: record?.data?._file,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "删除失败");
      }
      setStatus({ type: "success", text: result.message || "已删除，下面的数据已更新。" });
      await onSubmitted?.();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "删除失败" });
    }
  }

  return (
    <section style={styles.shell}>
      <div style={styles.headingRow}>
        <div>
          <h2 style={styles.title}>训练录入</h2>
          <p style={styles.subtitle}>填完直接保存到 IELTS 数据库，下面的图表会自动刷新</p>
        </div>
        <button type="submit" form="ielts-entry-form" style={styles.submitBtn}>
          {active.submitLabel}
        </button>
      </div>

      <div style={styles.tabs} role="tablist" aria-label="IELTS workflows">
        {workflows.map((workflow) => (
          <button
            key={workflow.id}
            type="button"
            role="tab"
            aria-selected={workflow.id === activeId}
            onClick={() => {
              setActiveId(workflow.id);
              setStatus({ type: "idle", text: "" });
            }}
            style={{
              ...styles.tab,
              ...(workflow.id === activeId ? styles.activeTab : {}),
            }}
          >
            {workflow.label}
          </button>
        ))}
      </div>

      <form id="ielts-entry-form" onSubmit={submitForm} style={styles.formGrid}>
        {active.fields.map((field) => (
          <label key={field.key} style={field.multiline ? styles.wideField : styles.field}>
            <span style={styles.label}>{field.label}</span>
            {field.options ? (
              <select
                value={values[active.id][field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                style={styles.input}
              >
                {field.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : field.multiline ? (
              <textarea
                value={values[active.id][field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                placeholder={field.placeholder}
                rows={5}
                style={styles.textarea}
              />
            ) : (
              <input
                value={values[active.id][field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                placeholder={field.placeholder}
                type={field.type || "text"}
                step={field.type === "number" ? "0.5" : undefined}
                style={styles.input}
              />
            )}
          </label>
        ))}
      </form>

      {activeRecords && (
        <div style={styles.records}>
          <div style={styles.recordsHeader}>
            <h3 style={styles.recordsTitle}>已有记录</h3>
            <span style={styles.recordsCount}>{activeRecords.length} 条</span>
          </div>
          {activeRecords.length ? (
            <div style={styles.recordList}>
              {activeRecords.map((record) => (
                <div key={record.data._file} style={styles.recordRow}>
                  <div style={styles.recordMain}>
                    <div style={styles.recordName}>{getRecordTitle(activeId, record)}</div>
                    <div style={styles.recordMeta}>{getRecordMeta(activeId, record)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteRecord(record)}
                    style={styles.deleteBtn}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyRecords}>还没有这类记录</div>
          )}
        </div>
      )}

      {status.text && (
        <div
          style={{
            ...styles.status,
            ...(status.type === "success" ? styles.success : {}),
            ...(status.type === "error" ? styles.error : {}),
          }}
        >
          {status.text}
        </div>
      )}
    </section>
  );
}

function getRecords(activeId, records) {
  if (!["writing", "reading", "listening", "speaking"].includes(activeId)) return null;
  return [...(records[activeId] || [])].reverse();
}

function getRecordTitle(type, record) {
  const data = record?.data || {};
  if (type === "writing") return `${data.date || "未标日期"} · ${data.task || "Writing"} · ${data.scores?.overall ?? "-"} 分`;
  if (type === "reading") return `${data.date || "未标日期"} · ${data.passage || "Reading"} · ${data.correct ?? "-"} / ${data.total_questions ?? "-"}`;
  if (type === "listening") return `${data.date || "未标日期"} · ${data.section || "Listening"} · ${data.correct ?? "-"} / ${data.total_questions ?? "-"}`;
  if (type === "speaking") return `${data.date || "未标日期"} · ${data.topic || "Speaking"}`;
  return data._file || "记录";
}

function getRecordMeta(type, record) {
  const data = record?.data || {};
  const file = data._file || "";
  if (type === "writing") return `${data.question_type || "writing"} · ${file}`;
  if (type === "reading") return `阅读分数 ${data.score ?? "-"} · ${file}`;
  if (type === "listening") return `听力分数 ${data.score ?? "-"} · ${file}`;
  if (type === "speaking") return `${data.story_group || "素材"} · ${file}`;
  return file;
}

const controlBase = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #334155",
  borderRadius: 8,
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
};

const styles = {
  shell: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: 24,
    marginBottom: 16,
  },
  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "#e2e8f0",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#94a3b8",
    fontSize: 13,
  },
  submitBtn: {
    border: "1px solid #38bdf8",
    borderRadius: 8,
    background: "#0ea5e9",
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    minWidth: 96,
    padding: "9px 14px",
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  tab: {
    border: "1px solid #334155",
    borderRadius: 8,
    background: "#0f172a",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 13,
    padding: "8px 12px",
  },
  activeTab: {
    background: "#164e63",
    borderColor: "#22d3ee",
    color: "#ecfeff",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    minWidth: 0,
  },
  wideField: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    gridColumn: "1 / -1",
    minWidth: 0,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    ...controlBase,
    height: 40,
    padding: "0 12px",
  },
  textarea: {
    ...controlBase,
    minHeight: 120,
    padding: 12,
    resize: "vertical",
    lineHeight: 1.55,
  },
  status: {
    marginTop: 16,
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#cbd5e1",
    fontSize: 13,
    padding: "10px 12px",
  },
  success: {
    borderColor: "#22c55e",
    color: "#bbf7d0",
  },
  error: {
    borderColor: "#f43f5e",
    color: "#fecdd3",
  },
  records: {
    borderTop: "1px solid #334155",
    marginTop: 20,
    paddingTop: 16,
  },
  recordsHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  recordsTitle: {
    color: "#e2e8f0",
    fontSize: 15,
    margin: 0,
  },
  recordsCount: {
    color: "#64748b",
    fontSize: 12,
  },
  recordList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  recordRow: {
    alignItems: "center",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    padding: "10px 12px",
  },
  recordMain: {
    minWidth: 0,
  },
  recordName: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: 700,
    overflowWrap: "anywhere",
  },
  recordMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
    overflowWrap: "anywhere",
  },
  deleteBtn: {
    border: "1px solid #7f1d1d",
    borderRadius: 8,
    background: "#450a0a",
    color: "#fecaca",
    cursor: "pointer",
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 12px",
  },
  emptyRecords: {
    color: "#64748b",
    fontSize: 13,
    padding: "8px 0",
  },
};
