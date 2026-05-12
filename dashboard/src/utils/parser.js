const DATA_BASE = "/data";

async function fetchJSON(name) {
  try {
    const res = await fetch(`${DATA_BASE}/${name}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadConfig() {
  return fetchJSON("config");
}

export async function loadWriting() {
  const data = await fetchJSON("writing");
  if (!data) return [];
  return Array.isArray(data) ? data : [];
}

export async function loadReading() {
  const data = await fetchJSON("reading");
  if (!data) return [];
  return Array.isArray(data) ? data : [];
}

export async function loadListening() {
  const data = await fetchJSON("listening");
  if (!data) return [];
  return Array.isArray(data) ? data : [];
}

export async function loadSpeaking() {
  const data = await fetchJSON("speaking");
  if (!data) return [];
  return Array.isArray(data) ? data : [];
}

export async function loadErrors() {
  return fetchJSON("errors");
}

export async function loadSynonyms() {
  return fetchJSON("synonyms");
}

export async function loadVocabulary() {
  return fetchJSON("vocabulary");
}

export async function loadStats() {
  return fetchJSON("stats");
}

export async function loadPlan() {
  return fetchJSON("plan");
}
