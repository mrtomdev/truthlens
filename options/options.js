const defaults = {
  autoScan: true,
  flagText: true,
  flagImages: true,
  flagAudio: true,
  minTextLength: 200,
  showInlineBadges: true,
  showOverlay: true
};

function load() {
  chrome.storage.sync.get(defaults, (s) => {
    document.getElementById("autoScan").checked = s.autoScan;
    document.getElementById("flagText").checked = s.flagText;
    document.getElementById("flagImages").checked = s.flagImages;
    document.getElementById("flagAudio").checked = s.flagAudio;
    document.getElementById("showInlineBadges").checked = s.showInlineBadges;
    document.getElementById("showOverlay").checked = s.showOverlay;
    document.getElementById("minTextLength").value = s.minTextLength;
  });
}

function save() {
  const next = {
    autoScan: document.getElementById("autoScan").checked,
    flagText: document.getElementById("flagText").checked,
    flagImages: document.getElementById("flagImages").checked,
    flagAudio: document.getElementById("flagAudio").checked,
    showInlineBadges: document.getElementById("showInlineBadges").checked,
    showOverlay: document.getElementById("showOverlay").checked,
    minTextLength: Math.max(80, Math.min(2000, parseInt(document.getElementById("minTextLength").value, 10) || 200))
  };
  chrome.storage.sync.set(next, () => {
    const s = document.getElementById("status");
    s.textContent = "Saved.";
    setTimeout(() => (s.textContent = ""), 1500);
  });
}

document.getElementById("save").addEventListener("click", save);
load();
