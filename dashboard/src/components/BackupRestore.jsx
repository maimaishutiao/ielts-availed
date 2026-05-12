import React, { useEffect, useRef, useState } from "react";
import { Card } from "./UI";

export default function BackupRestore({ onRestored }) {
  const [backups, setBackups] = useState([]);
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);

  async function loadBackups() {
    const response = await fetch("/api/backups");
    if (!response.ok) return;
    const result = await response.json();
    setBackups(result.backups || []);
    setSelected((current) => current || result.backups?.[0]?.name || "");
  }

  useEffect(() => {
    loadBackups();
  }, []);

  async function createBackup() {
    setStatus("备份中...");
    const response = await fetch("/api/backups", { method: "POST" });
    const result = await response.json();
    setStatus(response.ok ? `已备份：${result.name}` : result.error || "备份失败");
    await loadBackups();
  }

  async function restoreBackup() {
    if (!selected) return;
    if (!window.confirm(`确定恢复这个备份吗？\n${selected}`)) return;
    setStatus("恢复中...");
    const response = await fetch("/api/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: selected }),
    });
    const result = await response.json();
    setStatus(response.ok ? result.message : result.error || "恢复失败");
    if (response.ok) await onRestored?.();
  }

  async function exportData() {
    setStatus("导出中...");
    try {
      const response = await fetch("/api/export");
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "导出失败");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const link = document.createElement("a");
      link.href = url;
      link.download = match?.[1] || "ielts-export.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("数据已导出。");
    } catch (error) {
      setStatus(error.message || "导出失败");
    }
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.confirm(`确定导入这个数据文件吗？\n${file.name}\n导入前会自动备份当前数据。`)) return;

    setStatus("导入中...");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "导入失败");
      setStatus(result.message || "数据已导入。");
      await loadBackups();
      await onRestored?.();
    } catch (error) {
      setStatus(error.message || "导入失败，请确认选择的是本网页导出的 JSON 文件。");
    }
  }

  return (
    <Card title="备份 / 迁移">
      <div style={styles.row}>
        <button type="button" onClick={createBackup} style={styles.primaryBtn}>
          一键备份
        </button>
        <button type="button" onClick={exportData} style={styles.secondaryBtn}>
          导出数据
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.secondaryBtn}>
          导入数据
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={importData}
          style={{ display: "none" }}
        />
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          style={styles.select}
        >
          <option value="">选择备份</option>
          {backups.map((backup) => (
            <option key={backup.name} value={backup.name}>
              {backup.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={restoreBackup} disabled={!selected} style={styles.restoreBtn}>
          恢复备份
        </button>
      </div>
      <div style={styles.hint}>
        备份保存在 ~/.ielts-backups/。导入支持本面板导出的 JSON 文件，导入前会自动备份当前数据。
      </div>
      {status && <div style={styles.status}>{status}</div>}
    </Card>
  );
}

const styles = {
  row: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  },
  primaryBtn: {
    background: "#0ea5e9",
    border: "1px solid #38bdf8",
    borderRadius: 8,
    color: "#f8fafc",
    cursor: "pointer",
    fontWeight: 800,
    padding: "9px 12px",
  },
  restoreBtn: {
    background: "#334155",
    border: "1px solid #475569",
    borderRadius: 8,
    color: "#e2e8f0",
    cursor: "pointer",
    fontWeight: 800,
    padding: "9px 12px",
  },
  secondaryBtn: {
    background: "#0f172a",
    border: "1px solid #38bdf8",
    borderRadius: 8,
    color: "#bae6fd",
    cursor: "pointer",
    fontWeight: 800,
    padding: "9px 12px",
  },
  select: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    minWidth: 0,
    padding: "0 10px",
  },
  hint: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 12,
  },
  status: {
    color: "#bbf7d0",
    fontSize: 13,
    marginTop: 10,
  },
};
