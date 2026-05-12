#!/usr/bin/env node
// IELTS v3.0 — 把 ~/.ielts/ 数据导出为 JSON，供 Dashboard 读取
// Usage: node data-export.js [output-dir]

const fs = require("fs");
const path = require("path");
const os = require("os");
const matter = require("gray-matter");

const IELTS_DIR = path.join(os.homedir(), ".ielts");
const OUTPUT_DIR = process.argv[2] || path.join(__dirname, "..", "dashboard", "public", "data");

function readMd(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw);
  flattenDates(parsed.data);
  return { data: parsed.data || {}, content: parsed.content || "" };
}

// Convert Date objects to "YYYY-MM-DD" strings for JSON serialization
function flattenDates(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (obj[key] instanceof Date) {
      const d = obj[key];
      obj[key] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else if (typeof obj[key] === "object") {
      flattenDates(obj[key]);
    }
  }
}

function readYamlFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  // For pure YAML files (no markdown), parse the whole thing as data
  const parsed = matter("---\n" + raw + "\n---");
  return parsed.data || {};
}

function readAllMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const result = readMd(path.join(dir, f));
      result.data._file = f;
      return result;
    })
    .sort((a, b) => String(a.data.date || "").localeCompare(String(b.data.date || "")));
}

// Parse a markdown table into an array of objects
// headers: column names in order (used as keys)
function parseMdTable(content, headers) {
  const rows = [];
  const lines = content.split("\n");
  let headerLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\|.*\|$/)) {
      // First |...| line is header, skip separator line, rest are data
      if (headerLineIdx === -1) {
        headerLineIdx = i;
      } else if (i > headerLineIdx + 1) {
        // Data row
        const cells = lines[i].split("|").slice(1, -1).map(c => c.trim());
        if (cells.length >= headers.length) {
          const row = {};
          headers.forEach((h, idx) => { row[h] = cells[idx] || ""; });
          rows.push(row);
        }
      }
    }
  }
  return rows;
}

function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Config
  const config = readYamlFile(path.join(IELTS_DIR, "config.yaml"));
  if (config) {
    // Calculate days left
    const examDateStr = config.exam?.date || config.date;
    if (examDateStr) {
      const examDate = new Date(examDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      config.days_left = Math.max(
        0,
        Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
      );
    }
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "config.json"),
      JSON.stringify(config, null, 2)
    );
  }

  // 2. Writing essays
  const essays = readAllMd(path.join(IELTS_DIR, "writing", "essays"));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "writing.json"),
    JSON.stringify(essays, null, 2)
  );

  // 3. Reading analyses
  const readings = readAllMd(path.join(IELTS_DIR, "reading", "analyses"));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "reading.json"),
    JSON.stringify(readings, null, 2)
  );

  // 4. Listening analyses
  const listenings = readAllMd(path.join(IELTS_DIR, "listening", "analyses"));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "listening.json"),
    JSON.stringify(listenings, null, 2)
  );

  // 5. Speaking stories
  const stories = readAllMd(path.join(IELTS_DIR, "speaking", "stories"));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "speaking.json"),
    JSON.stringify(stories, null, 2)
  );

  // 6. Error book
  const errorBookRaw = readMd(path.join(IELTS_DIR, "errors", "error-book.md"));
  let errorBook = errorBookRaw ? { ...errorBookRaw.data } : null;
  if (errorBookRaw && errorBookRaw.content) {
    errorBook.errors = parseMdTable(errorBookRaw.content, ["type", "frequency", "last_seen", "example"]);
  }
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "errors.json"),
    JSON.stringify(errorBook, null, 2)
  );

  // 7. Synonym library
  const synonymsRaw = readMd(
    path.join(IELTS_DIR, "vocabulary", "synonym-master.md")
  );
  let synonyms = synonymsRaw ? { ...synonymsRaw.data } : null;
  if (synonymsRaw && synonymsRaw.content) {
    synonyms.rows = parseMdTable(synonymsRaw.content, ["question", "replacement", "source", "date"]);
  }
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "synonyms.json"),
    JSON.stringify(synonyms, null, 2)
  );

  // 8. Vocabulary
  const vocabRaw = readMd(path.join(IELTS_DIR, "vocabulary", "word-bank.md"));
  const vocab = vocabRaw ? vocabRaw.data : null;
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "vocabulary.json"),
    JSON.stringify(vocab, null, 2)
  );

  // 9. Aggregated stats
  const stats = {
    writing: {
      total: essays.length,
      scores: essays
        .filter((e) => e.data.scores && e.data.scores.overall != null)
        .map((e) => ({
          date: e.data.date,
          overall: e.data.scores.overall,
          tr: e.data.scores.tr,
          cc: e.data.scores.cc,
          lr: e.data.scores.lr,
          gra: e.data.scores.gra,
        })),
    },
    reading: {
      total: readings.length,
      scores: readings.map((r) => ({
        date: r.data.date,
        correct: r.data.correct,
        total: r.data.total_questions,
        score: r.data.score,
      })),
    },
    listening: {
      total: listenings.length,
      scores: listenings.map((l) => ({
        date: l.data.date,
        correct: l.data.correct,
        total: l.data.total_questions,
        score: l.data.score,
      })),
    },
    speaking: {
      total: stories.length,
    },
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "stats.json"),
    JSON.stringify(stats, null, 2)
  );

  // 10. Study plan
  const planRaw = readMd(path.join(IELTS_DIR, "plans", "study-plan.md"));
  const plan = planRaw ? planRaw.data : null;
  if (plan) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "plan.json"),
      JSON.stringify(plan, null, 2)
    );
  }

  console.log(`Data exported to ${OUTPUT_DIR}`);
  console.log(
    `  Essays: ${essays.length} | Readings: ${readings.length} | Listenings: ${listenings.length} | Stories: ${stories.length}`
  );
}

main();
