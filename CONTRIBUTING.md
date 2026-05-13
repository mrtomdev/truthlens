# Contributing to TruthLens

Thanks for wanting to make AI-content detection more accessible.

## Quick start

1. Fork & clone the repo.
2. Load the unpacked extension at `chrome://extensions` (Developer mode on).
3. Make changes — reload the extension from `chrome://extensions` after each edit.
4. Run the detector tests: `node tests/text-detector.test.js`
5. Open a PR with a clear description of what you changed and *why*.

## What we welcome

- **New phrase fingerprints** for the text detector (cite a source or include an example).
- **Additional known-AI hosts** for the image detector.
- **Better pixel heuristics** — ideally backed by a small experiment.
- **Localisations** — phrase fingerprints in Spanish, French, Urdu, Hindi, Arabic, etc.
- **Reproducible test cases** (real vs. AI samples). Public-domain sources only.

## What we won't accept

- Pull requests that ship a remote API or send page content off-device. TruthLens is on-device by design.
- Hard-coded ML models that bloat the extension beyond ~1 MB unless they're meaningfully better than the heuristics.
- Anything that adds analytics or telemetry.

## Style

- Vanilla JS (ES modules). No frameworks, no build step.
- 2-space indent. Semicolons. Single quotes for strings.
- Keep functions small and honest. Comment the *why*, not the *what*.

## Reporting issues

Include:
- Browser + version
- A reproducible URL or snippet
- The full signal breakdown from the badge popover (it tells us which heuristic fired)

## Code of conduct

Be kind. Be honest about what detection can and can't do. Don't oversell.
