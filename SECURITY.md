# Security Policy

## Reporting a vulnerability

If you find a security issue in TruthLens — for example, a way to make the
content script execute attacker-controlled code, a cross-site leak, or a
storage-permission abuse — please report it privately first.

Email: **ihtisham.skp@gmail.com**
Subject line: `[TruthLens security]`

Please include:
- The browser and version you reproduced on
- A minimal proof-of-concept
- The impact you believe this has

We aim to acknowledge within 72 hours and ship a fix within 14 days for
high-severity issues. Once a fix ships, we'll credit you in the release notes
unless you'd rather stay anonymous.

## Scope

In scope:
- The extension code (manifest, background, content, detectors, popup, options)
- Anything that could exfiltrate page content off-device (this would be a
  contradiction of the project's core promise)

Out of scope:
- Heuristic false positives or false negatives (these are detector quality
  issues, not security issues — open a regular GitHub issue for those)
- Issues that require a compromised host browser

## Our commitments

- No telemetry, ever.
- No remote code loading.
- No exfiltration of page content.
- Minimal permissions — we only request what's needed for in-page scanning.
