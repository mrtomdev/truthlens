# TruthLens — AI Toxicity & Synthetic Media Detection (Browser Extension)

> **Open-source, on-device browser extension that flags AI-generated text, deepfake images, and cloned audio in real time. Free. Private. No tracking. No server. Works on Chrome, Edge, Brave, and Opera.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-blue.svg)](manifest.json)
[![No telemetry](https://img.shields.io/badge/Telemetry-None-success.svg)](#privacy)
[![Made with vanilla JS](https://img.shields.io/badge/Built_with-Vanilla_JS-yellow.svg)](#architecture)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

**Keywords:** AI detector, deepfake detector, AI text detector, ChatGPT detector, GPT detector, deepfake detection browser extension, synthetic media detection, AI image detection, voice clone detector, AI generated content detector, media literacy tool, disinformation detector, open source AI detector, free AI detector, Chrome extension AI detection, Manifest V3, on-device AI detection, privacy-first AI detector.

---

## Why TruthLens exists

Generative AI now writes news articles, fakes voices, and clones faces faster than platforms can moderate. The result: a flood of **convincing deepfakes, automated scams, and localized disinformation** that overwhelm fact-checkers, journalists, and ordinary readers.

TruthLens gives every internet user a **lightweight, transparent, second opinion** — right in the browser. It does not promise certainty (no detector can), but it surfaces the **signals** that distinguish AI-generated content from human-made content, so you can decide for yourself.

### Built for:

- 📰 **Journalists** verifying sources and quotes
- 🎓 **Teachers & professors** flagging AI homework and plagiarism
- 🛡 **Researchers** studying disinformation at scale
- 👨‍👩‍👧 **Parents** protecting kids from synthetic media
- 🗳 **Voters** spotting election-cycle deepfakes
- 💼 **Recruiters** detecting AI-generated cover letters
- 🌍 **Everyone** living through the synthetic-media era

---

## ✨ Features

| Capability | What it does |
|---|---|
| 🧠 **AI text detection** | Scans articles, comments, and reviews for LLM fingerprints: burstiness, common-word ratio, phrase signatures, syntactic uniformity. |
| 🖼 **Deepfake / synthetic image detection** | Pixel-level analysis: high-frequency energy, color-histogram entropy, noise-uniformity. Plus known-AI-host detection (Midjourney, DALL·E, Stable Diffusion, Leonardo, Ideogram). |
| 🎙 **Cloned voice detection** | Spectral flatness, silence regularity, and pitch-jitter analysis on audio and video elements. |
| 🏷 **Inline badges** | Clear ⚠ warning badges right next to suspect content — click for a full signal breakdown. |
| 📊 **Floating verdict panel** | Per-page summary of flagged text, images, and audio. |
| ⌨ **Keyboard shortcut** | `Ctrl+Shift+T` (`⌘+Shift+T` on Mac) to re-scan any page. |
| 🧰 **Right-click scan** | Context-menu integration for selective scanning. |
| 🔒 **Zero telemetry** | All analysis runs locally. Nothing is sent to a server. Ever. |
| 🌐 **Works everywhere** | Chrome, Edge, Brave, Opera, Arc, Vivaldi — any Chromium-based browser. |

---

## 🚀 Quick install (developer mode)

1. Clone or download this repo:
   ```bash
   git clone https://github.com/mrtomdev/truthlens.git
   ```
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked** and select the `truthlens` folder.
5. Pin TruthLens to your toolbar and start scanning.

> A signed Chrome Web Store release is on the roadmap once we finish the public beta.

---

## 🧪 How it works

TruthLens is **deliberately transparent**. Every verdict comes with the underlying signal scores so you can audit the decision.

### Text detection (`detectors/text-detector.js`)

LLM output exhibits measurable statistical fingerprints — even when the topic is short:

| Signal | What it measures | Why it matters |
|---|---|---|
| **Burstiness** | Variance in sentence length | Humans alternate short and long sentences. LLMs cluster around a median. |
| **Common-word ratio** | Share of high-frequency tokens | LLMs over-rely on common words ("the", "of", "and"). |
| **Phrase fingerprints** | 25+ known LLM phrases (`delve into`, `tapestry`, `it's important to note`, `in conclusion`, etc.) | LLM-tuning incentivises a recognisable vocabulary. |
| **Repetition** | Bigram and trigram repetition ratio | Templated outputs repeat phrases at characteristic rates. |
| **Syntactic uniformity** | Diversity of sentence openings | LLMs reuse a narrow set of clause-starters. |

Scores are weighted and combined into a final 0–1 confidence. Anything above 0.72 is flagged **likely AI**.

### Image detection (`detectors/image-detector.js`)

Heuristics targeting the most reliable diffusion / GAN tells:

| Signal | Method |
|---|---|
| **High-frequency energy** | Sobel-based edge magnitude. Diffusion outputs are unusually smooth. |
| **Color entropy** | 64-bin RGB histogram entropy. Synthetic images cluster more tightly. |
| **Noise uniformity** | Coefficient-of-variation of per-block luminance std-dev. Real cameras have spatially varying noise; diffusion does not. |
| **Provenance hints** | Known AI host detection (Midjourney CDN, DALL·E blob storage, Leonardo, Ideogram, Replicate, etc.). |
| **Filename/alt-text hints** | Common patterns (`mj_*`, `sd_*`, `flux-*`, `ai-generated`). |

### Audio detection (`detectors/audio-detector.js`)

Voice clones share three weaknesses:

| Signal | Method |
|---|---|
| **Spectral flatness** | Geometric/arithmetic-mean ratio per window — TTS spectra are flatter. |
| **Silence regularity** | Coefficient-of-variation of pause durations. Synthesised speech has unnaturally uniform pauses. |
| **Pitch jitter** | Zero-crossing-rate variance. Human voices jitter; TTS smooths it. |

> ⚠ **Honesty notice.** These are heuristics, not forensic proof. They produce false positives and false negatives. TruthLens is a *first-pass triage*, not a courtroom verdict. The signals are open and documented precisely so you can verify the reasoning.

---

## 🛡 Privacy

- **All detection runs in your browser.** Audio, images, and text are never uploaded.
- **No telemetry, no analytics, no remote logging.** Open the network tab and watch.
- **No accounts.** No sign-up. No "free trial".
- **Open source.** Read every line. Audit every commit.
- The only thing stored is **your settings** (Chrome's sync storage) and a **local count** of how many items you've flagged.

---

## 🧱 Architecture

```
truthlens/
├── manifest.json              # Manifest V3
├── background/
│   └── service-worker.js      # Badge counts, commands, context menus
├── content/
│   ├── content-script.js      # Page scanner + UI injection
│   └── overlay.css            # Namespaced badge & popover styles
├── detectors/
│   ├── text-detector.js       # Burstiness, fingerprints, syntactic uniformity
│   ├── image-detector.js      # High-freq energy, color entropy, noise uniformity
│   └── audio-detector.js      # Spectral flatness, silence regularity, pitch jitter
├── popup/                     # Toolbar popup UI
├── options/                   # Settings page
├── icons/                     # SVG-derived icons (16/32/48/128)
└── tests/                     # Unit tests for detectors (Node-runnable)
```

**Tech stack:** Vanilla JavaScript (ES modules). No bundler. No framework. No tracking SDK. ~30KB minified.

---

## 🧪 Run the tests

The detectors are pure functions and can be exercised in plain Node:

```bash
node tests/text-detector.test.js
```

---

## 🗺 Roadmap

- [ ] WebAssembly port of the image detector for 5× speed
- [ ] Optional ONNX-based classifier (loaded only on demand, still on-device)
- [ ] C2PA Content Credentials verification
- [ ] Firefox / Safari ports
- [ ] Translation-aware text detection
- [ ] Browser-native deepfake video frame sampling
- [ ] Curated "known-AI publication" allow/deny list
- [ ] Localised LLM-fingerprint dictionaries (Spanish, French, German, Hindi, Urdu, Arabic)

---

## 🤝 Contributing

PRs are welcome — especially:

- New phrase fingerprints (with sources / examples)
- Additional known-AI hosts / CDNs
- Better pixel-level heuristics
- Localisations
- Reproducible test cases (real vs. AI examples)

Open an issue first for anything larger than a bug fix.

---

## 📖 Press & coverage

If you're a journalist writing about generative-AI detection, deepfakes, or media literacy, feel free to reach out. The project's design and limitations are intentionally documented so the conversation can be honest about what detection can and cannot do today.

---

## 🏷 SEO topics this project covers

`ai-detector` `deepfake-detector` `chatgpt-detector` `gpt-detector` `ai-text-detector`
`deepfake-detection-extension` `synthetic-media-detection` `ai-image-detector`
`voice-clone-detector` `disinformation` `misinformation` `media-literacy`
`browser-extension` `chrome-extension` `manifest-v3` `privacy-first`
`open-source-ai-detector` `free-ai-detector` `on-device-ai`
`midjourney-detector` `dalle-detector` `stable-diffusion-detector`
`audio-deepfake` `voice-deepfake` `journalism-tool` `fact-checking-tool`

---

## 📜 License

[MIT](LICENSE) — use it, fork it, ship it. Just keep the copyright line.

---

## ⭐ Star history

If TruthLens helped you spot something, **star the repo** — it helps more people find independent, open detection tools instead of paywalled black-box services.
