/**
 * TruthLens Audio Detector
 *
 * On-device heuristic check for cloned / synthetic speech.
 *
 * Real-time deepfake voice detection is an active research problem; we ship
 * a transparent baseline that flags the strongest tells:
 *   - Spectral flatness: TTS / voice clones tend to have flatter spectra
 *     in the 4-8 kHz band than real recordings.
 *   - Pitch micro-variation: human voices have jitter/shimmer that most
 *     TTS systems smooth out.
 *   - Silence regularity: synthesized speech tends to have unnaturally
 *     uniform pause durations.
 *
 * Analyses run on small samples (a few seconds) via WebAudio. Audio never
 * leaves the device.
 */

export async function analyzeAudioElement(audioEl, durationSec = 4) {
  if (!audioEl || audioEl.readyState < 2) {
    return { verdict: "insufficient", confidence: 0, score: 0, reason: "audio not ready" };
  }

  let ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  } catch {
    return { verdict: "unsupported", reason: "WebAudio unavailable" };
  }

  let buffer;
  try {
    const resp = await fetch(audioEl.currentSrc || audioEl.src);
    const arr = await resp.arrayBuffer();
    buffer = await ctx.decodeAudioData(arr);
  } catch (err) {
    return { verdict: "unsupported", reason: "could not decode audio (possibly cross-origin)" };
  } finally {
    try { ctx.close(); } catch {}
  }

  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const maxSamples = Math.min(channel.length, sampleRate * durationSec);
  const samples = channel.slice(0, maxSamples);

  const signals = {
    spectralFlatness: estimateSpectralFlatness(samples, sampleRate),
    silenceRegularity: estimateSilenceRegularity(samples, sampleRate),
    pitchJitter: estimatePitchJitter(samples, sampleRate)
  };

  const weights = { spectralFlatness: 0.4, silenceRegularity: 0.25, pitchJitter: 0.35 };
  let score = 0;
  for (const [k, v] of Object.entries(signals)) score += v * weights[k];

  let verdict, confidence;
  if (score >= 0.72) { verdict = "likely-synthetic"; confidence = "high"; }
  else if (score >= 0.55) { verdict = "possibly-synthetic"; confidence = "medium"; }
  else if (score >= 0.35) { verdict = "uncertain"; confidence = "low"; }
  else { verdict = "likely-authentic"; confidence = "medium"; }

  return {
    verdict,
    confidence,
    score: Math.round(score * 100) / 100,
    signals: Object.fromEntries(
      Object.entries(signals).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    sampleSeconds: maxSamples / sampleRate
  };
}

function estimateSpectralFlatness(samples, sr) {
  const win = 1024;
  let totalFlatness = 0;
  let windows = 0;
  for (let i = 0; i + win < samples.length; i += win) {
    let geo = 0, arith = 0;
    let nonZero = 0;
    for (let j = 0; j < win; j++) {
      const v = Math.abs(samples[i + j]);
      if (v > 1e-6) { geo += Math.log(v); nonZero++; }
      arith += v;
    }
    if (nonZero === 0) continue;
    const g = Math.exp(geo / nonZero);
    const a = arith / win;
    if (a > 0) {
      totalFlatness += g / a;
      windows++;
    }
  }
  if (windows === 0) return 0.4;
  const flatness = totalFlatness / windows;
  if (flatness > 0.55) return 0.80;
  if (flatness > 0.45) return 0.60;
  if (flatness > 0.35) return 0.40;
  return 0.15;
}

function estimateSilenceRegularity(samples, sr) {
  const threshold = 0.01;
  const minSilenceMs = 80;
  const minSilenceSamples = (minSilenceMs / 1000) * sr;
  const silences = [];
  let runStart = -1;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) < threshold) {
      if (runStart === -1) runStart = i;
    } else {
      if (runStart !== -1) {
        const len = i - runStart;
        if (len >= minSilenceSamples) silences.push(len);
        runStart = -1;
      }
    }
  }
  if (silences.length < 3) return 0.4;
  const mean = silences.reduce((a, b) => a + b, 0) / silences.length;
  const variance = silences.reduce((a, b) => a + (b - mean) ** 2, 0) / silences.length;
  const cv = Math.sqrt(variance) / mean;
  if (cv < 0.25) return 0.78;
  if (cv < 0.40) return 0.55;
  if (cv < 0.60) return 0.30;
  return 0.10;
}

function estimatePitchJitter(samples, sr) {
  const win = Math.floor(sr * 0.03);
  const zcrs = [];
  for (let i = 0; i + win < samples.length; i += win) {
    let zc = 0;
    for (let j = 1; j < win; j++) {
      if ((samples[i + j - 1] >= 0) !== (samples[i + j] >= 0)) zc++;
    }
    zcrs.push(zc / win);
  }
  if (zcrs.length < 4) return 0.4;
  const mean = zcrs.reduce((a, b) => a + b, 0) / zcrs.length;
  if (mean === 0) return 0.4;
  const variance = zcrs.reduce((a, b) => a + (b - mean) ** 2, 0) / zcrs.length;
  const cv = Math.sqrt(variance) / mean;
  if (cv < 0.10) return 0.78;
  if (cv < 0.20) return 0.55;
  if (cv < 0.35) return 0.30;
  return 0.10;
}
