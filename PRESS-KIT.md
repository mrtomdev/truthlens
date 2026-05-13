# TruthLens — Press Kit

> **Tagline:** "The free, open-source browser extension that flags ChatGPT, deepfakes, and cloned voices — in real time, on-device."

## One-line description
TruthLens is a free, open-source browser extension that detects AI-generated text, deepfake images, and cloned voices in real time, entirely on the user's device.

## One-paragraph description
TruthLens is a privacy-first browser extension built for journalists, teachers, parents, and voters living through the synthetic-media era. It scans the pages you visit and flags AI-generated text (ChatGPT, Claude, Gemini), deepfake images (Midjourney, DALL·E, Stable Diffusion, Flux), and cloned voices — with transparent statistical signals you can audit yourself. It is open source under the MIT license, runs entirely on-device with zero telemetry, and works on every Chromium-based browser.

## Key facts
- **License:** MIT (open source)
- **Privacy:** 100% on-device · no telemetry · no accounts · no servers
- **Stack:** Manifest V3 · vanilla JavaScript · ~30 KB
- **Browsers:** Chrome, Edge, Brave, Opera, Arc, Vivaldi
- **Maintainer:** Tom ([@mrtomdev](https://github.com/mrtomdev))
- **Source:** https://github.com/mrtomdev/truthlens

## What makes it newsworthy
1. **It's free and open** while paid competitors charge $10–$30/month.
2. **It runs on-device.** No content uploaded — a meaningful contrast with cloud detectors that have themselves been involved in leak incidents.
3. **It's transparent.** Every verdict ships with the underlying signal scores so users (and reporters) can audit how the decision was made.
4. **It handles text, images, AND voice.** Most consumer tools cover only one modality.
5. **It targets the right audience:** journalists, teachers, parents, voters — not enterprise compliance teams.

## Suggested story angles
- "An open-source alternative to GPTZero that runs entirely in your browser"
- "How to spot a deepfake before the platform moderators do"
- "The free Chrome extension teachers are using to triage AI essays"
- "Why on-device AI detection matters in an election year"
- "Inside the heuristics that catch ChatGPT writing"

## Honest limitations (please print these too)
- This is a triage tool, not a forensic verdict. False positives and false negatives are real and acknowledged in the README.
- Skilled human editing of LLM output reduces detection accuracy — like every detector on the market.
- Image / audio detection is heuristic, not model-based. A trained classifier is on the roadmap.

## Quotes you can use
> "Detection isn't about producing certainty — it's about giving people a second opinion they can audit. That's why every TruthLens verdict shows the underlying signals."

> "The synthetic-media era doesn't end with a single magic detector. It ends with media literacy tools that are free, transparent, and live in every browser."

## Contact
- **Email:** ihtisham.skp@gmail.com
- **GitHub:** [@mrtomdev](https://github.com/mrtomdev)

## Logo & social preview
- SVG logo: `icons/icon.svg`
- Social preview image: `docs/social-preview.svg` (1280×640)
