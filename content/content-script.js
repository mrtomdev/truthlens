/**
 * TruthLens content script
 *
 * - Scans visible text blocks, images, audio, and video on the page.
 * - Renders inline badges and a floating verdict panel.
 * - All detection runs locally; only verdict counts are sent to the
 *   service worker for the badge counter.
 */

(async () => {
  if (window.__truthlensInjected) return;
  window.__truthlensInjected = true;

  const detectorBaseUrl = chrome.runtime.getURL("detectors/");
  const [textMod, imageMod, audioMod] = await Promise.all([
    import(detectorBaseUrl + "text-detector.js"),
    import(detectorBaseUrl + "image-detector.js"),
    import(detectorBaseUrl + "audio-detector.js")
  ]);

  const { analyzeText } = textMod;
  const { deepAnalyze: analyzeImage, quickHeuristicCheck } = imageMod;
  const { analyzeAudioElement } = audioMod;

  const state = {
    findings: [],
    settings: await loadSettings(),
    scanning: false
  };

  if (state.settings.autoScan) {
    requestIdleCallback(() => runScan(), { timeout: 2000 });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "TRUTHLENS_SCAN") {
      runScan().then(r => sendResponse(r));
      return true;
    }
    if (msg?.type === "TRUTHLENS_GET_FINDINGS") {
      sendResponse({ findings: state.findings, url: location.href });
      return false;
    }
  });

  async function loadSettings() {
    return new Promise(res => {
      chrome.storage.sync.get(
        {
          autoScan: true,
          flagText: true,
          flagImages: true,
          flagAudio: true,
          minTextLength: 120,
          showInlineBadges: true,
          showOverlay: true
        },
        res
      );
    });
  }

  async function runScan() {
    if (state.scanning) return { status: "in-progress" };
    state.scanning = true;
    state.findings = [];

    try {
      if (state.settings.flagText) await scanText();
      if (state.settings.flagImages) await scanImages();
      if (state.settings.flagAudio) await scanAudio();

      chrome.runtime.sendMessage({
        type: "TRUTHLENS_RESULTS",
        url: location.href,
        findings: state.findings.map(f => ({
          kind: f.kind, verdict: f.verdict, score: f.score
        }))
      });

      if (state.settings.showOverlay) renderOverlay();
      return { status: "done", count: state.findings.length };
    } finally {
      state.scanning = false;
    }
  }

  async function scanText() {
    const blocks = collectTextBlocks(state.settings.minTextLength);
    for (const block of blocks) {
      const text = block.innerText || block.textContent || "";
      const result = analyzeText(text);
      if (result.verdict === "likely-ai" || result.verdict === "possibly-ai") {
        state.findings.push({ kind: "text", element: block, ...result });
        if (state.settings.showInlineBadges) attachBadge(block, "text", result);
      }
      await yieldToBrowser();
    }
  }

  async function scanImages() {
    const imgs = Array.from(document.querySelectorAll("img"))
      .filter(img => isVisible(img) && img.naturalWidth >= 200 && img.naturalHeight >= 200);

    for (const img of imgs) {
      const quick = quickHeuristicCheck(img);
      let result;
      if (quick.score >= 0.5) {
        result = await analyzeImage(img);
      } else {
        // For potentially-authentic images, still do a cheap pixel check.
        result = await analyzeImage(img);
      }
      if (result.verdict === "likely-ai" || result.verdict === "possibly-ai") {
        state.findings.push({ kind: "image", element: img, ...result });
        if (state.settings.showInlineBadges) attachBadge(img, "image", result);
      }
      await yieldToBrowser();
    }
  }

  async function scanAudio() {
    const media = Array.from(document.querySelectorAll("audio, video"))
      .filter(m => m.currentSrc && isVisible(m));
    for (const m of media) {
      try {
        const result = await analyzeAudioElement(m, 3);
        if (result.verdict === "likely-synthetic" || result.verdict === "possibly-synthetic") {
          state.findings.push({ kind: "audio", element: m, ...result });
          if (state.settings.showInlineBadges) attachBadge(m, "audio", result);
        }
      } catch { /* ignore */ }
      await yieldToBrowser();
    }
  }

  function collectTextBlocks(minChars) {
    const out = [];
    const seen = new WeakSet();
    const push = (el) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      const txt = (el.innerText || el.textContent || "").trim();
      if (txt.length >= minChars && isVisible(el)) out.push(el);
    };

    // Pass 1: semantic article containers (news, blogs).
    document.querySelectorAll(
      "article, [role=article], main p, main li, .post, .entry, .content p, .story-body p, .article-body p, blockquote"
    ).forEach(push);

    // Pass 2: known LLM chat UIs (ChatGPT, Claude, Gemini, Perplexity, Poe, Copilot).
    document.querySelectorAll(
      "[data-message-author-role], [data-testid^='conversation-turn'], " +
      "[data-message-id], .markdown.prose, .prose, " +
      "[class*='message-content'], [class*='MessageContent'], " +
      "[class*='chat-message'], [class*='ChatMessage'], " +
      ".model-response-text, message-content"
    ).forEach(push);

    // Pass 3: every paragraph + long div on the page.
    if (out.length < 3) {
      document.querySelectorAll("p, li, div").forEach(el => {
        if (el.children.length > 6) return; // skip layout containers
        push(el);
      });
    }

    return out.slice(0, 60);
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function yieldToBrowser() {
    return new Promise(r => setTimeout(r, 0));
  }

  function attachBadge(target, kind, result) {
    const badge = document.createElement("span");
    badge.className = `truthlens-badge truthlens-${result.verdict}`;
    badge.setAttribute("data-truthlens", kind);
    badge.textContent = verdictLabel(result.verdict);
    badge.title = `TruthLens · ${kind}\nScore: ${result.score}\n${result.reason || ""}`;
    badge.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      showDetailPopover(badge, kind, result);
    });

    if (kind === "text") {
      target.style.position = target.style.position || "relative";
      target.prepend(badge);
    } else if (kind === "image") {
      wrapAndOverlay(target, badge);
    } else if (kind === "audio") {
      target.insertAdjacentElement("beforebegin", badge);
    }
  }

  function wrapAndOverlay(img, badge) {
    if (img.parentElement?.classList?.contains("truthlens-img-wrap")) {
      img.parentElement.appendChild(badge);
      return;
    }
    const wrap = document.createElement("span");
    wrap.className = "truthlens-img-wrap";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
    wrap.appendChild(badge);
  }

  function verdictLabel(v) {
    return {
      "likely-ai": "⚠ Likely AI",
      "possibly-ai": "? Possibly AI",
      "likely-synthetic": "⚠ Likely Synthetic",
      "possibly-synthetic": "? Possibly Synthetic"
    }[v] || "TruthLens";
  }

  function showDetailPopover(anchor, kind, result) {
    document.querySelectorAll(".truthlens-popover").forEach(n => n.remove());
    const pop = document.createElement("div");
    pop.className = "truthlens-popover";
    const signalRows = Object.entries(result.signals || {})
      .map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`)
      .join("");
    pop.innerHTML = `
      <div class="head">
        <span class="title">TruthLens · ${kind}</span>
        <button class="close" aria-label="Close">×</button>
      </div>
      <div class="verdict">${verdictLabel(result.verdict)}</div>
      <div class="score">Confidence score: <b>${result.score}</b></div>
      <div class="reason">${escapeHtml(result.reason || "")}</div>
      <div class="signals">${signalRows}</div>
      <div class="foot">All analysis ran locally. Heuristic only — not forensic proof.</div>
    `;
    const rect = anchor.getBoundingClientRect();
    pop.style.top = (window.scrollY + rect.bottom + 6) + "px";
    pop.style.left = (window.scrollX + rect.left) + "px";
    document.body.appendChild(pop);
    pop.querySelector(".close").addEventListener("click", () => pop.remove());
  }

  function renderOverlay() {
    document.querySelectorAll(".truthlens-overlay").forEach(n => n.remove());
    if (state.findings.length === 0) return;

    const overlay = document.createElement("aside");
    overlay.className = "truthlens-overlay";
    const counts = state.findings.reduce((acc, f) => {
      acc[f.kind] = (acc[f.kind] || 0) + 1;
      return acc;
    }, {});
    overlay.innerHTML = `
      <header>
        <span class="brand">TruthLens</span>
        <button class="tl-min" aria-label="Minimize">_</button>
        <button class="tl-close" aria-label="Close">×</button>
      </header>
      <div class="counts">
        <div><b>${counts.text || 0}</b> text</div>
        <div><b>${counts.image || 0}</b> image</div>
        <div><b>${counts.audio || 0}</b> audio</div>
      </div>
      <p class="hint">Click any badge on the page for details.</p>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector(".tl-close").onclick = () => overlay.remove();
    overlay.querySelector(".tl-min").onclick = () => overlay.classList.toggle("min");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[c]));
  }
})();
