const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const port = Number(process.env.PORT || 8080);
const root = path.join(__dirname, "..", "dashboard", "dist");
const ieltsDir = path.join(os.homedir(), ".ielts");
const dataDir = path.join(root, "data");
const backupDir = path.join(os.homedir(), ".ielts-backups");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
  });
  fs.createReadStream(filePath).pipe(res);
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) {
        reject(new Error("提交内容太大"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function ensureDirs() {
  [
    "writing/essays",
    "reading/analyses",
    "listening/analyses",
    "speaking/stories",
    "vocabulary",
    "errors",
    "stats",
    "plans",
  ].forEach((dir) => fs.mkdirSync(path.join(ieltsDir, dir), { recursive: true }));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slug(value) {
  return String(value || "entry")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "entry";
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function yamlString(value) {
  return JSON.stringify(String(value || ""));
}

function markdown(frontmatter, title, sections) {
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${JSON.stringify(value)}`;
      if (typeof value === "number") return `${key}: ${value}`;
      if (value && typeof value === "object") return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${yamlString(value)}`;
    })
    .join("\n");

  const body = sections
    .filter((section) => section.content)
    .map((section) => `## ${section.title}\n\n${section.content}`)
    .join("\n\n");

  return `---\n${yaml}\n---\n\n# ${title}\n\n${body}\n`;
}

function writeConfig(values) {
  const config = `target:
  overall: ${number(values.overall, 7)}
  listening: ${number(values.listening, 7)}
  reading: ${number(values.reading, 7)}
  writing: ${number(values.writing, 6.5)}
  speaking: ${number(values.speaking, 6.5)}

exam:
  date: ${yamlString(values.examDate || today())}

level:
  current: intermediate
  mock_scores:
    listening: 0
    reading: 0
    writing: 0
    speaking: 0

preferences:
  study_hours_per_day: 3
  focus: ${yamlString(values.focus || "writing")}
`;
  fs.writeFileSync(path.join(ieltsDir, "config.yaml"), config);
}

function saveWriting(values) {
  const scores = {
    tr: number(values.tr),
    cc: number(values.cc),
    lr: number(values.lr),
    gra: number(values.gra),
  };
  const overall = number(values.overall, Math.round(((scores.tr + scores.cc + scores.lr + scores.gra) / 4) * 2) / 2);
  const date = today();
  const content = markdown(
    {
      type: "writing",
      date,
      task: values.task || "task2",
      question_type: values.questionType || "opinion",
      word_count: String(values.essay || "").trim().split(/\s+/).filter(Boolean).length,
      scores: { ...scores, overall },
      target: number(values.target, 6.5),
      errors: listLines(values.errorTags),
      improvements: values.notes ? [values.notes] : [],
    },
    "Writing Practice",
    [
      { title: "Question", content: values.question },
      { title: "Essay", content: values.essay },
      { title: "Notes", content: values.notes },
    ]
  );
  fs.writeFileSync(path.join(ieltsDir, "writing", "essays", `${date}-${Date.now()}.md`), content);
  updateErrorBook(values.errorTags);
  updateSynonymMaster(values.synonyms, "writing");
}

function saveReading(values) {
  const date = today();
  const content = markdown(
    {
      type: "reading",
      date,
      passage: values.passage || "Reading practice",
      total_questions: Math.max(1, number(values.total, 40)),
      correct: number(values.correct),
      score: number(values.score),
      errors_by_type: {},
      synonyms_extracted: parseSynonymLines(values.synonyms),
    },
    "Reading Analysis",
    [
      { title: "Questions", content: values.questions },
      { title: "Notes", content: values.notes },
    ]
  );
  fs.writeFileSync(path.join(ieltsDir, "reading", "analyses", `${date}-${Date.now()}.md`), content);
  updateErrorBook(values.errorTags);
  updateSynonymMaster(values.synonyms, "reading");
}

function saveListening(values) {
  const date = today();
  const content = markdown(
    {
      type: "listening",
      date,
      section: values.section || "full",
      total_questions: Math.max(1, number(values.total, 40)),
      correct: number(values.correct),
      score: number(values.score),
      errors_by_type: listLines(values.errorTags).reduce((acc, item) => ({ ...acc, [item]: 1 }), {}),
      error_details: listLines(values.mistakes),
      question_types: listLines(values.questionTypes),
      intensive_task: values.intensiveTask || "",
    },
    "Listening Analysis",
    [
      { title: "Mistakes", content: values.mistakes },
      { title: "Question Types", content: values.questionTypes },
      { title: "Intensive Listening Task", content: values.intensiveTask },
      { title: "Notes", content: values.notes },
    ]
  );
  fs.writeFileSync(path.join(ieltsDir, "listening", "analyses", `${date}-${Date.now()}.md`), content);
  updateErrorBook(values.errorTags);
  updateSynonymMaster(values.synonyms, "listening");
}

function saveSpeaking(values) {
  const date = today();
  const content = markdown(
    {
      type: "speaking",
      date,
      topic: values.topic || "Speaking topic",
      story_group: values.storyGroup || "general",
    },
    values.topic || "Speaking Story",
    [{ title: "Content", content: values.content }]
  );
  fs.writeFileSync(path.join(ieltsDir, "speaking", "stories", `${date}-${slug(values.topic)}.md`), content);
}

function saveVocab(values) {
  const file = path.join(ieltsDir, "vocabulary", "word-bank.md");
  const words = String(values.words || "")
    .split(/\n+/)
    .map((word) => word.trim())
    .filter(Boolean);
  const existing = fs.existsSync(file)
    ? fs.readFileSync(file, "utf-8").replace(/^---[\s\S]*?---\s*/, "")
    : "# 间隔重复词库\n\n## Words\n";
  const rows = words.map((word) => `- ${word}${values.context ? ` (${values.context})` : ""}`).join("\n");
  const total = (existing.match(/^- /gm) || []).length + words.length;
  const content = `---\ntype: word-bank\ntotal: ${total}\ndue_today: ${words.length}\n---\n\n${existing.trim()}\n${rows ? `\n${rows}\n` : "\n"}`;
  fs.writeFileSync(file, content);
}

function savePlan(values) {
  const date = today();
  const priorities = Array.isArray(values.priorities) ? values.priorities : [];
  const tasks = Array.isArray(values.tasks) ? values.tasks : [];
  const scores = Array.isArray(values.scores) ? values.scores : [];
  const content = markdown(
    {
      type: "study-plan",
      last_updated: date,
      priorities,
      tasks,
      scores,
    },
    "IELTS Study Plan",
    [
      { title: "Priorities", content: priorities.map((item) => `- ${item}`).join("\n") },
      { title: "Tasks", content: tasks.map((item) => `- ${item}`).join("\n") },
    ]
  );
  fs.writeFileSync(path.join(ieltsDir, "plans", "study-plan.md"), content);
}

function listLines(value) {
  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSynonymLines(value) {
  return listLines(value).map((line) => {
    const [question, replacement] = line.split(/\s*(?:=>|->|→|,|，)\s*/);
    return {
      question: String(question || "").trim(),
      replacement: String(replacement || "").trim(),
    };
  }).filter((item) => item.question || item.replacement);
}

function updateErrorBook(value) {
  const tags = listLines(value);
  if (!tags.length) return;

  const file = path.join(ieltsDir, "errors", "error-book.md");
  const date = today();
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
  const existingRows = raw
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("错误类型"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4 && cells[0]);
  const map = new Map();
  existingRows.forEach(([type, frequency, lastSeen, example]) => {
    map.set(type, {
      type,
      frequency: number(frequency, 0),
      lastSeen: lastSeen || date,
      example: example || "",
    });
  });
  tags.forEach((tag) => {
    const current = map.get(tag) || { type: tag, frequency: 0, lastSeen: date, example: tag };
    current.frequency += 1;
    current.lastSeen = date;
    current.example = current.example || tag;
    map.set(tag, current);
  });
  const rows = [...map.values()]
    .sort((a, b) => b.frequency - a.frequency)
    .map((item) => `| ${item.type} | ${item.frequency} | ${item.lastSeen} | ${item.example} |`)
    .join("\n");
  const content = `---\ntype: error-book\ntotal_errors: ${[...map.values()].reduce((sum, item) => sum + item.frequency, 0)}\nlast_updated: ${yamlString(date)}\n---\n\n# 高频错题聚合\n\n按错误类型聚合，按频率排序。\n\n| 错误类型 | 频率 | 最近出现 | 典型案例 |\n|---------|------|---------|---------|\n${rows}\n`;
  fs.writeFileSync(file, content);
}

function updateSynonymMaster(value, source) {
  const rows = parseSynonymLines(value);
  if (!rows.length) return;

  const file = path.join(ieltsDir, "vocabulary", "synonym-master.md");
  const date = today();
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf-8").replace(/^---[\s\S]*?---\s*/, "") : "# 四科同义替换累计库\n\n| 题目用词 | 原文/高分替换 | 来源 | 添加日期 |\n|---------|-------------|------|---------|";
  const existingCount = raw
    .split("\n")
    .filter((line) => {
      if (!line.startsWith("|")) return false;
      if (line.includes("题目用词") || line.includes("---")) return false;
      return line.split("|").slice(1, -1).some((cell) => cell.trim());
    }).length;
  const newRows = rows
    .map((item) => `| ${item.question || "-"} | ${item.replacement || "-"} | ${source} | ${date} |`)
    .join("\n");
  const total = existingCount + rows.length;
  const content = `---\ntype: synonym-master\ntotal: ${total}\nsource: ["writing","reading","listening"]\n---\n\n${raw.trim()}\n${newRows ? `\n${newRows}\n` : "\n"}`;
  fs.writeFileSync(file, content);
}

const recordDirs = {
  writing: path.join("writing", "essays"),
  reading: path.join("reading", "analyses"),
  listening: path.join("listening", "analyses"),
  speaking: path.join("speaking", "stories"),
};

function deleteRecord(values) {
  const dir = recordDirs[values.type];
  const file = path.basename(String(values.file || ""));
  if (!dir || !file || !file.endsWith(".md")) {
    throw new Error("无法识别要删除的记录");
  }

  const recordsDir = path.join(ieltsDir, dir);
  const target = path.join(recordsDir, file);
  if (!target.startsWith(recordsDir + path.sep)) {
    throw new Error("记录路径不合法");
  }
  if (!fs.existsSync(target)) {
    throw new Error("记录不存在或已经删除");
  }

  fs.unlinkSync(target);
}

function listBackups() {
  if (!fs.existsSync(backupDir)) return [];
  return fs
    .readdirSync(backupDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("ielts-backup-"))
    .map((entry) => {
      const fullPath = path.join(backupDir, entry.name);
      return {
        name: entry.name,
        created: fs.statSync(fullPath).mtime.toISOString().slice(0, 19).replace("T", " "),
      };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

function createBackup() {
  if (!fs.existsSync(ieltsDir)) throw new Error("~/.ielts/ 不存在，先保存一条数据或初始化目录");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  const name = `ielts-backup-${stamp}`;
  const target = path.join(backupDir, name);
  fs.cpSync(ieltsDir, target, {
    recursive: true,
    filter: (source) => !source.startsWith(backupDir),
  });
  return { name, path: target };
}

function restoreBackup(name) {
  const backupName = path.basename(String(name || ""));
  if (!backupName.startsWith("ielts-backup-")) throw new Error("备份名称不合法");
  const source = path.join(backupDir, backupName);
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
    throw new Error("备份不存在");
  }

  fs.mkdirSync(backupDir, { recursive: true });
  if (fs.existsSync(ieltsDir)) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
    fs.renameSync(ieltsDir, path.join(backupDir, `pre-restore-${stamp}`));
  }
  fs.cpSync(source, ieltsDir, { recursive: true });
}

function walkFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath, base);
    if (!entry.isFile()) return [];
    return [{
      path: path.relative(base, fullPath).replace(/\\/g, "/"),
      content: fs.readFileSync(fullPath, "utf-8"),
    }];
  });
}

function exportPackage() {
  if (!fs.existsSync(ieltsDir)) throw new Error("~/.ielts/ 不存在，先保存一条数据或初始化目录");
  return {
    type: "ielts-dashboard-export",
    version: 1,
    exported_at: new Date().toISOString(),
    files: walkFiles(ieltsDir),
  };
}

function safeImportPath(relativePath) {
  const normalized = path.normalize(String(relativePath || "")).replace(/^([/\\])+/, "");
  if (!normalized || normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(`导入文件路径不合法：${relativePath}`);
  }
  return normalized;
}

function importPackage(payload) {
  if (payload?.type !== "ielts-dashboard-export" || !Array.isArray(payload.files)) {
    throw new Error("只支持从本网页导出的 IELTS JSON 数据包");
  }
  if (payload.files.length > 1000) throw new Error("导入文件太多");

  fs.mkdirSync(backupDir, { recursive: true });
  if (fs.existsSync(ieltsDir)) createBackup();
  ensureDirs();

  payload.files.forEach((file) => {
    const relativePath = safeImportPath(file.path);
    const target = path.join(ieltsDir, relativePath);
    if (!target.startsWith(ieltsDir + path.sep)) {
      throw new Error(`导入文件路径不合法：${file.path}`);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, String(file.content || ""));
  });

  return payload.files.length;
}

function exportData() {
  fs.mkdirSync(dataDir, { recursive: true });
  execFileSync("node", [path.join(__dirname, "..", "scripts", "data-export.js"), dataDir], {
    stdio: "inherit",
    env: { ...process.env, HOME: os.homedir() },
  });
}

async function handleSubmission(req, res) {
  try {
    ensureDirs();
    const payload = JSON.parse(await readBody(req));
    const values = payload.values || {};

    if (payload.type === "config") writeConfig(values);
    else if (payload.type === "writing") saveWriting(values);
    else if (payload.type === "reading") saveReading(values);
    else if (payload.type === "listening") saveListening(values);
    else if (payload.type === "speaking") saveSpeaking(values);
    else if (payload.type === "vocab") saveVocab(values);
    else return json(res, 400, { error: "未知的提交类型" });

    exportData();
    json(res, 200, { message: "已保存，仪表盘数据已刷新。" });
  } catch (error) {
    json(res, 500, { error: error.message || "保存失败" });
  }
}

async function handlePlanSave(req, res) {
  try {
    ensureDirs();
    const payload = JSON.parse(await readBody(req));
    savePlan(payload);
    exportData();
    json(res, 200, { message: "备考计划已保存，仪表盘数据已刷新。" });
  } catch (error) {
    json(res, 500, { error: error.message || "保存计划失败" });
  }
}

async function handleRecordDelete(req, res) {
  try {
    ensureDirs();
    const payload = JSON.parse(await readBody(req));
    deleteRecord(payload);
    exportData();
    json(res, 200, { message: "记录已删除，仪表盘数据已刷新。" });
  } catch (error) {
    json(res, 500, { error: error.message || "删除失败" });
  }
}

async function handleBackupCreate(req, res) {
  try {
    const backup = createBackup();
    json(res, 200, { message: "备份已创建。", ...backup, backups: listBackups() });
  } catch (error) {
    json(res, 500, { error: error.message || "备份失败" });
  }
}

async function handleBackupList(req, res) {
  try {
    json(res, 200, { backups: listBackups() });
  } catch (error) {
    json(res, 500, { error: error.message || "读取备份失败" });
  }
}

async function handleRestore(req, res) {
  try {
    const payload = JSON.parse(await readBody(req));
    restoreBackup(payload.name);
    exportData();
    json(res, 200, { message: "备份已恢复，仪表盘数据已刷新。" });
  } catch (error) {
    json(res, 500, { error: error.message || "恢复失败" });
  }
}

async function handleExport(req, res) {
  try {
    const payload = exportPackage();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-");
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ielts-export-${stamp}.json"`,
    });
    res.end(JSON.stringify(payload, null, 2));
  } catch (error) {
    json(res, 500, { error: error.message || "导出失败" });
  }
}

async function handleImport(req, res) {
  try {
    const payload = JSON.parse(await readBody(req));
    const count = importPackage(payload);
    exportData();
    json(res, 200, { message: `已导入 ${count} 个文件，仪表盘数据已刷新。` });
  } catch (error) {
    json(res, 500, { error: error.message || "导入失败" });
  }
}

http
  .createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/submissions") {
      handleSubmission(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/plan") {
      handlePlanSave(req, res);
      return;
    }
    if (req.method === "DELETE" && req.url === "/api/records") {
      handleRecordDelete(req, res);
      return;
    }
    if (req.method === "GET" && req.url === "/api/backups") {
      handleBackupList(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/backups") {
      handleBackupCreate(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/restore") {
      handleRestore(req, res);
      return;
    }
    if (req.method === "GET" && req.url === "/api/export") {
      handleExport(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/import") {
      handleImport(req, res);
      return;
    }

    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(root, safePath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(root, "index.html");
    }

    sendFile(res, filePath);
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`IELTS dashboard is running at http://0.0.0.0:${port}`);
  });
