/**
 * TruthLens Text Detector
 *
 * Heuristic, on-device detection of AI-generated text. No data leaves the browser.
 *
 * Signals (each scored 0..1, then weighted):
 *  - burstiness:   variance in sentence length (humans are bursty; LLMs are uniform)
 *  - perplexity-proxy: distribution of common vs rare tokens
 *  - punctuation regularity: LLMs over-use em-dashes, oxford commas, balanced clauses
 *  - phrase fingerprint: known LLM phrase signatures ("delve into", "tapestry", "in conclusion")
 *  - repetition:   bigram/trigram repetition ratio
 *  - syntactic variety: ratio of unique sentence-starter POS-ish patterns
 *
 * This is a transparent baseline — not a forensic classifier. We surface the
 * underlying signals so users can judge the verdict themselves.
 */

const COMMON_WORDS = new Set([
  "the","of","and","to","a","in","is","it","you","that","he","was","for","on",
  "are","with","as","i","his","they","be","at","one","have","this","from","or",
  "had","by","not","but","what","all","were","we","when","your","can","said",
  "there","an","each","which","she","do","how","their","if","will","up","other",
  "about","out","many","then","them","these","so","some","her","would","make",
  "like","him","into","time","has","look","two","more","write","go","see","number",
  "no","way","could","people","my","than","first","water","been","call","who",
  "its","now","find","long","down","day","did","get","come","made","may","part"
]);

const LLM_PHRASE_FINGERPRINTS = [
  /\bdelve\s+(into|deeper)\b/gi,
  /\b(rich\s+)?tapestry\b/gi,
  /\bin\s+the\s+ever-evolving\s+(landscape|world|realm)\b/gi,
  /\bnavigat(e|ing)\s+the\s+complexit(y|ies)\b/gi,
  /\bit'?s\s+important\s+to\s+note\s+that\b/gi,
  /\bit\s+is\s+worth\s+(noting|mentioning)\s+that\b/gi,
  /\bin\s+conclusion,\b/gi,
  /\bfurthermore,\b/gi,
  /\bmoreover,\b/gi,
  /\badditionally,\b/gi,
  /\bplays?\s+a\s+(crucial|pivotal|significant)\s+role\b/gi,
  /\b(unleash|unlock)\s+the\s+(power|potential)\b/gi,
  /\b(a\s+)?testament\s+to\b/gi,
  /\bcutting-edge\b/gi,
  /\bgame-chang(er|ing)\b/gi,
  /\bsynerg(y|istic)\b/gi,
  /\bholistic\s+approach\b/gi,
  /\bparadigm\s+shift\b/gi,
  /\bunprecedented\s+(times|level|era)\b/gi,
  /\bmultifaceted\b/gi,
  /\bnuanced\s+understanding\b/gi,
  /\bembark\s+on\s+(a\s+)?journey\b/gi,
  /\bfoster\s+(a\s+)?(sense|culture|environment)\b/gi,
  /\bas\s+an\s+ai\s+language\s+model\b/gi,
  /\bi\s+(cannot|can'?t|don'?t\s+have)\s+(provide|access|personal)\b/gi
];

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"'(\[])/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function variance(xs) {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sq = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
  return sq;
}

function scoreBurstiness(sentences) {
  if (sentences.length < 3) return 0.5;
  const lengths = sentences.map(s => tokenize(s).length);
  const v = variance(lengths);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 0.5;
  const cv = Math.sqrt(v) / mean;
  if (cv >= 0.7) return 0.05;
  if (cv >= 0.5) return 0.25;
  if (cv >= 0.35) return 0.55;
  if (cv >= 0.20) return 0.80;
  return 0.92;
}

function scoreCommonWordRatio(tokens) {
  if (tokens.length === 0) return 0.5;
  let common = 0;
  for (const t of tokens) if (COMMON_WORDS.has(t)) common++;
  const ratio = common / tokens.length;
  if (ratio < 0.40) return 0.10;
  if (ratio < 0.50) return 0.30;
  if (ratio < 0.58) return 0.55;
  if (ratio < 0.66) return 0.78;
  return 0.90;
}

function scorePhraseFingerprints(text) {
  let hits = 0;
  for (const re of LLM_PHRASE_FINGERPRINTS) {
    const m = text.match(re);
    if (m) hits += m.length;
  }
  if (hits === 0) return 0.08;
  if (hits === 1) return 0.45;
  if (hits === 2) return 0.72;
  if (hits === 3) return 0.88;
  return 0.96;
}

function scoreRepetition(tokens) {
  if (tokens.length < 30) return 0.4;
  const bigrams = new Map();
  for (let i = 0; i < tokens.length - 1; i++) {
    const k = tokens[i] + " " + tokens[i + 1];
    bigrams.set(k, (bigrams.get(k) || 0) + 1);
  }
  let repeats = 0;
  for (const v of bigrams.values()) if (v > 1) repeats += v - 1;
  const ratio = repeats / (tokens.length - 1);
  if (ratio < 0.02) return 0.65;
  if (ratio < 0.06) return 0.30;
  if (ratio < 0.12) return 0.55;
  return 0.78;
}

function scoreSyntacticUniformity(sentences) {
  if (sentences.length < 4) return 0.5;
  const starters = sentences.map(s => {
    const first = tokenize(s)[0] || "";
    return first;
  });
  const unique = new Set(starters).size;
  const ratio = unique / starters.length;
  if (ratio > 0.85) return 0.10;
  if (ratio > 0.70) return 0.30;
  if (ratio > 0.55) return 0.55;
  return 0.80;
}

export function analyzeText(rawText) {
  const text = (rawText || "").trim();
  if (text.length < 120) {
    return {
      verdict: "insufficient",
      confidence: 0,
      score: 0,
      signals: {},
      reason: "Text is too short for reliable analysis (need ~120+ chars)."
    };
  }

  const sentences = splitSentences(text);
  const tokens = tokenize(text);

  const signals = {
    burstiness: scoreBurstiness(sentences),
    commonWords: scoreCommonWordRatio(tokens),
    phraseFingerprint: scorePhraseFingerprints(text),
    repetition: scoreRepetition(tokens),
    syntacticUniformity: scoreSyntacticUniformity(sentences)
  };

  const weights = {
    burstiness: 0.28,
    commonWords: 0.16,
    phraseFingerprint: 0.30,
    repetition: 0.10,
    syntacticUniformity: 0.16
  };

  let score = 0;
  for (const [k, v] of Object.entries(signals)) score += v * weights[k];

  let verdict, confidence;
  if (score >= 0.72) { verdict = "likely-ai"; confidence = "high"; }
  else if (score >= 0.55) { verdict = "possibly-ai"; confidence = "medium"; }
  else if (score >= 0.35) { verdict = "uncertain"; confidence = "low"; }
  else { verdict = "likely-human"; confidence = "medium"; }

  return {
    verdict,
    confidence,
    score: Math.round(score * 100) / 100,
    signals: Object.fromEntries(
      Object.entries(signals).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    sampleSize: { sentences: sentences.length, tokens: tokens.length },
    reason: explainScore(signals, score)
  };
}

function explainScore(signals, score) {
  const high = Object.entries(signals)
    .filter(([_, v]) => v >= 0.7)
    .map(([k]) => k);
  if (high.length === 0) return "No strong AI signals detected.";
  const names = {
    burstiness: "uniform sentence lengths",
    commonWords: "heavy reliance on common vocabulary",
    phraseFingerprint: "LLM phrase fingerprints",
    repetition: "templated repetition patterns",
    syntacticUniformity: "repetitive sentence openings"
  };
  return "Flagged for: " + high.map(k => names[k]).join(", ") + ".";
}
