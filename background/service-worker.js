/**
 * TruthLens service worker.
 *  - Counts findings per tab and reflects them on the toolbar badge.
 *  - Wires up the keyboard command and context menu.
 *  - Persists per-site aggregate stats for the popup.
 */

const tabStats = new Map(); // tabId -> { url, counts, ts }

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "truthlens-scan",
    title: "Scan with TruthLens",
    contexts: ["page", "image", "selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "truthlens-scan" && tab?.id) triggerScan(tab.id);
});

chrome.commands.onCommand.addListener((cmd) => {
  if (cmd !== "scan-page") return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) triggerScan(tabs[0].id);
  });
});

chrome.action.onClicked.addListener(() => { /* popup handles it */ });

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "TRUTHLENS_RESULTS" && sender.tab?.id != null) {
    const counts = { text: 0, image: 0, audio: 0 };
    for (const f of msg.findings) counts[f.kind] = (counts[f.kind] || 0) + 1;
    const total = counts.text + counts.image + counts.audio;
    tabStats.set(sender.tab.id, {
      url: msg.url, counts, total, ts: Date.now()
    });
    chrome.action.setBadgeText({
      tabId: sender.tab.id, text: total > 0 ? String(total) : ""
    });
    chrome.action.setBadgeBackgroundColor({
      tabId: sender.tab.id, color: total > 0 ? "#dc2626" : "#16a34a"
    });
    bumpGlobalStats(counts);
  }
  if (msg?.type === "TRUTHLENS_GET_TAB_STATS") {
    const tabId = msg.tabId ?? sender.tab?.id;
    return Promise.resolve(tabStats.get(tabId) || { counts: { text: 0, image: 0, audio: 0 }, total: 0 });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => tabStats.delete(tabId));

function triggerScan(tabId) {
  chrome.tabs.sendMessage(tabId, { type: "TRUTHLENS_SCAN" }).catch(() => {
    // Content script may not be injected on chrome:// pages — silently ignore.
  });
}

async function bumpGlobalStats(counts) {
  const { tlGlobalStats = { text: 0, image: 0, audio: 0, scans: 0 } } =
    await chrome.storage.local.get("tlGlobalStats");
  tlGlobalStats.text += counts.text || 0;
  tlGlobalStats.image += counts.image || 0;
  tlGlobalStats.audio += counts.audio || 0;
  tlGlobalStats.scans += 1;
  await chrome.storage.local.set({ tlGlobalStats });
}
