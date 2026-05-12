export function aggregateWritingScores(essays) {
  if (!essays || essays.length === 0)
    return { scores: [], total: 0, latest: null, avgByDimension: null };

  // Flatten: scores may be nested under e.data.scores or flat under e.data
  const scores = essays.map((e) => {
    const d = e.data || e;
    const s = d.scores || d;
    return {
      date: d.date,
      overall: s.overall,
      tr: s.tr,
      cc: s.cc,
      lr: s.lr,
      gra: s.gra,
    };
  }).filter((d) => d.overall != null);

  if (scores.length === 0)
    return { scores: [], total: essays.length, latest: null, avgByDimension: null };

  const latest = scores[scores.length - 1];
  const dims = ["tr", "cc", "lr", "gra"];
  const avgByDimension = {};
  const recentN = scores.slice(-5);

  dims.forEach((dim) => {
    const vals = recentN.filter((s) => s[dim] != null).map((s) => s[dim]);
    avgByDimension[dim] =
      vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2
        : null;
  });

  return { scores, total: essays.length, latest, avgByDimension };
}

export function aggregateReadingScores(analyses) {
  if (!analyses || analyses.length === 0)
    return { scores: [], total: 0, latest: null, avgScore: null };

  const scores = analyses
    .map((a) => a.data || a)
    .filter((d) => d.score != null);

  if (scores.length === 0)
    return { scores: [], total: analyses.length, latest: null, avgScore: null };

  const latest = scores[scores.length - 1];
  const recentN = scores.slice(-5);
  const avgScore =
    recentN.length > 0
      ? Math.round(
          (recentN.reduce((a, b) => a + b.score, 0) / recentN.length) * 2
        ) / 2
      : null;

  return { scores, total: analyses.length, latest, avgScore };
}

export function aggregateListeningScores(analyses) {
  if (!analyses || analyses.length === 0)
    return { scores: [], total: 0, latest: null, avgScore: null };

  const scores = analyses
    .map((a) => a.data || a)
    .filter((d) => d.score != null);

  if (scores.length === 0)
    return { scores: [], total: analyses.length, latest: null, avgScore: null };

  const latest = scores[scores.length - 1];
  const recentN = scores.slice(-5);
  const avgScore =
    recentN.length > 0
      ? Math.round(
          (recentN.reduce((a, b) => a + b.score, 0) / recentN.length) * 2
        ) / 2
      : null;

  return { scores, total: analyses.length, latest, avgScore };
}

export function getRadarData(config, writing, reading, listening) {
  const target = config?.target || {};
  const writingLatest = writing?.latest;
  const readingLatest = reading?.latest;
  const listeningLatest = listening?.latest;

  return [
    {
      subject: "Listening",
      current: listeningLatest?.score || 0,
      target: target.listening || 0,
    },
    {
      subject: "Reading",
      current: readingLatest?.score || 0,
      target: target.reading || 0,
    },
    {
      subject: "Writing",
      current: writingLatest?.overall || 0,
      target: target.writing || 0,
    },
    {
      subject: "Speaking",
      current: 0,
      target: target.speaking || 0,
    },
  ];
}

export function getWritingTrendData(scores) {
  if (!scores || scores.length === 0) return [];
  return scores.map((s) => ({
    date: s.date || "",
    TR: s.tr,
    CC: s.cc,
    LR: s.lr,
    GRA: s.gra,
    Overall: s.overall,
  }));
}

export function getReadingTrendData(scores) {
  if (!scores || scores.length === 0) return [];
  return scores.map((s) => ({
    date: s.date || "",
    Score: s.score,
    Rate: s.total_questions
      ? Math.round((s.correct / s.total_questions) * 100)
      : null,
  }));
}

export function getListeningTrendData(scores) {
  if (!scores || scores.length === 0) return [];
  return scores.map((s) => ({
    date: s.date || "",
    Score: s.score,
    Rate: s.total_questions
      ? Math.round((s.correct / s.total_questions) * 100)
      : null,
  }));
}
