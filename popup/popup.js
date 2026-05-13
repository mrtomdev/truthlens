const $ = (id) => document.getElementById(id);

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refresh() {
  const tab = await activeTab();
  if (!tab) return;
  const stats = await chrome.runtime.sendMessage({ type: "TRUTHLENS_GET_TAB_STATS", tabId: tab.id });
  const counts = stats?.counts || { text: 0, image: 0, audio: 0 };
  $("cText").textContent = counts.text;
  $("cImage").textContent = counts.image;
  $("cAudio").textContent = counts.audio;
  if ((stats?.total || 0) === 0) {
    $("hint").innerHTML = "No AI-generated content flagged on this page yet.";
  } else {
    $("hint").innerHTML = `Flagged <b>${stats.total}</b> suspicious item(s). Click badges on the page for details.`;
  }

  const { tlGlobalStats = { scans: 0, text: 0, image: 0, audio: 0 } } =
    await chrome.storage.local.get("tlGlobalStats");
  $("gScans").textContent = tlGlobalStats.scans;
  $("gFlags").textContent = tlGlobalStats.text + tlGlobalStats.image + tlGlobalStats.audio;
}

$("scan").addEventListener("click", async () => {
  const tab = await activeTab();
  if (!tab) return;
  $("scan").disabled = true;
  $("scan").textContent = "Scanning…";
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "TRUTHLENS_SCAN" });
  } catch {
    $("hint").textContent = "Can't scan this page (browser internal page).";
  }
  setTimeout(async () => {
    $("scan").disabled = false;
    $("scan").textContent = "Scan this page";
    await refresh();
  }, 600);
});

$("openOptions").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

refresh();
