import React, { useState, useEffect, useRef } from "react";
import Countdown from "./components/Countdown";
import ScoreTrend from "./components/ScoreTrend";
import RadarChartComponent from "./components/RadarChart";
import ReadingStats from "./components/ReadingStats";
import ListeningStats from "./components/ListeningStats";
import SynonymLib from "./components/SynonymLib";
import VocabProgress from "./components/VocabProgress";
import ErrorHeatmap from "./components/ErrorHeatmap";
import SkillPromptBuilder from "./components/SkillPromptBuilder";
import DiagnosisPlan from "./components/DiagnosisPlan";
import BackupRestore from "./components/BackupRestore";
import FeatureChecklist from "./components/FeatureChecklist";
import {
  loadConfig,
  loadWriting,
  loadReading,
  loadListening,
  loadSpeaking,
  loadErrors,
  loadSynonyms,
  loadVocabulary,
  loadPlan,
} from "./utils/parser";
import {
  aggregateWritingScores,
  aggregateReadingScores,
  aggregateListeningScores,
  getRadarData,
  getWritingTrendData,
  getReadingTrendData,
  getListeningTrendData,
} from "./utils/aggregator";
import { Card, Empty } from "./components/UI";

export default function App() {
  const [config, setConfig] = useState(null);
  const [writing, setWriting] = useState(null);
  const [reading, setReading] = useState(null);
  const [listening, setListening] = useState(null);
  const [speaking, setSpeaking] = useState(null);
  const [errors, setErrors] = useState(null);
  const [synonyms, setSynonyms] = useState(null);
  const [vocab, setVocab] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const entryRef = useRef(null);
  const backupRef = useRef(null);
  const progressRef = useRef(null);
  const vocabRef = useRef(null);
  const planRef = useRef(null);
  const synonymsRef = useRef(null);
  const errorsRef = useRef(null);

  async function loadAll() {
    setLoading(true);
    const [
      cfg,
      w,
      r,
      l,
      sp,
      err,
      syn,
      voc,
      pln,
    ] = await Promise.all([
      loadConfig(),
      loadWriting(),
      loadReading(),
      loadListening(),
      loadSpeaking(),
      loadErrors(),
      loadSynonyms(),
      loadVocabulary(),
      loadPlan(),
    ]);

    setConfig(cfg);
    setWriting(w);
    setReading(r);
    setListening(l);
    setSpeaking(sp);
    setErrors(err);
    setSynonyms(syn);
    setVocab(voc);
    setPlan(pln);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <div style={{ marginTop: 16, color: "#64748b" }}>Loading data...</div>
      </div>
    );
  }

  const writingAgg = aggregateWritingScores(writing);
  const readingAgg = aggregateReadingScores(reading);
  const listeningAgg = aggregateListeningScores(listening);
  const radarData = getRadarData(config, writingAgg, readingAgg, listeningAgg);
  const writingTrend = getWritingTrendData(writingAgg.scores);
  const readingTrend = getReadingTrendData(readingAgg.scores);
  const listeningTrend = getListeningTrendData(listeningAgg.scores);

  function scrollToSection(section) {
    const refs = {
      entry: entryRef,
      backup: backupRef,
      progress: progressRef,
      vocab: vocabRef,
      plan: planRef,
      synonyms: synonymsRef,
      errors: errorsRef,
    };
    refs[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>IELTS Dashboard</h1>
        <span style={styles.subtitle}>
          {speaking?.length || 0} 素材 | {vocab?.total || 0} 词
        </span>
      </header>

      <div ref={entryRef}>
        <SkillPromptBuilder
          onSubmitted={loadAll}
          records={{
            writing,
            reading,
            listening,
            speaking,
          }}
        />
      </div>

      <div style={styles.grid}>
        <div style={styles.cardWide}>
          <FeatureChecklist onNavigate={scrollToSection} />
        </div>
        <div ref={backupRef} style={styles.card}>
          <BackupRestore onRestored={loadAll} />
        </div>
      </div>

      <div ref={progressRef} style={styles.grid}>
        <div style={styles.card}>
          <Countdown config={config} />
        </div>
        <div style={styles.card}>
          <RadarChartComponent data={radarData} />
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <ScoreTrend
            data={writingTrend}
            target={config?.target?.writing}
          />
        </div>
        <div style={styles.card}>
          <ReadingStats data={readingTrend} />
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <ListeningStats data={listeningTrend} />
        </div>
        <div ref={vocabRef} style={styles.card}>
          <VocabProgress data={vocab} />
        </div>
      </div>

      <div style={styles.grid}>
        <div ref={planRef} style={styles.card}>
          <DiagnosisPlan
            config={config}
            writing={writing}
            reading={reading}
            listening={listening}
            speaking={speaking}
            errors={errors}
            plan={plan}
            onSaved={loadAll}
          />
        </div>
        <div ref={synonymsRef} style={styles.card}>
          <SynonymLib data={synonyms} />
        </div>
      </div>

      <div style={styles.grid}>
        <div ref={errorsRef} style={styles.card}>
          <ErrorHeatmap data={errors} />
        </div>
      </div>

      <footer style={styles.footer}>
        IELTS Availed | Data from ~/.ielts/ |{" "}
        <button
          onClick={() => window.location.reload()}
          style={styles.refreshBtn}
        >
          Refresh
        </button>
      </footer>
    </div>
  );
}

const styles = {
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #334155",
    borderTopColor: "#38bdf8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 32,
    padding: "0 8px",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  card: {
    background: "#1e293b",
    borderRadius: 8,
    padding: 24,
    border: "1px solid #334155",
  },
  cardWide: {
    background: "#1e293b",
    borderRadius: 8,
    padding: 24,
    border: "1px solid #334155",
    gridColumn: "1 / -1",
  },
  footer: {
    textAlign: "center",
    color: "#475569",
    fontSize: 12,
    marginTop: 32,
    paddingBottom: 24,
  },
  refreshBtn: {
    background: "none",
    border: "1px solid #475569",
    color: "#64748b",
    padding: "2px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
};
