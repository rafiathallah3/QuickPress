// src/popup.ts
var SHORTCUT_STORAGE_KEY = "shortcut";
var DEFAULT_SHORTCUT = {
  ctrl: true,
  alt: false,
  shift: false,
  meta: false,
  key: "q"
};
var highlightButton = document.getElementById("highlight");
var statusEl = document.getElementById("status");
var shortcutForm = document.getElementById("shortcut-form");
var keyInput = document.getElementById("shortcut-key");
var ctrlInput = document.getElementById("shortcut-ctrl");
var altInput = document.getElementById("shortcut-alt");
var shiftInput = document.getElementById("shortcut-shift");
var metaInput = document.getElementById("shortcut-meta");
var shortcutStatus = document.getElementById("shortcut-status");
var saveShortcutButton = document.getElementById("save-shortcut");
async function updateStatus(text) {
  statusEl.textContent = text;
}
async function highlightActiveTab() {
  highlightButton.disabled = true;
  await updateStatus("Highlighting...");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      await updateStatus("No active tab detected.");
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { type: "HIGHLIGHT" });
    await updateStatus("Toggled highlight!");
  } catch (error) {
    console.error(error);
    await updateStatus("Failed to message content script.");
  } finally {
    highlightButton.disabled = false;
  }
}
var sanitizeShortcut = (value) => {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_SHORTCUT };
  }
  const candidate = value;
  const trimmedKey = typeof candidate.key === "string" && candidate.key.trim().length > 0 ? candidate.key.trim().toLowerCase().slice(0, 1) : DEFAULT_SHORTCUT.key;
  return {
    ctrl: Boolean(candidate.ctrl),
    alt: Boolean(candidate.alt),
    shift: Boolean(candidate.shift),
    meta: Boolean(candidate.meta),
    key: trimmedKey
  };
};
var setShortcutStatus = (message, isError = false) => {
  shortcutStatus.textContent = message;
  shortcutStatus.style.color = isError ? "#b91c1c" : "#1b2430";
};
var applyShortcutToForm = (config) => {
  keyInput.value = config.key.toUpperCase();
  ctrlInput.checked = config.ctrl;
  altInput.checked = config.alt;
  shiftInput.checked = config.shift;
  metaInput.checked = config.meta;
};
var loadShortcut = async () => {
  try {
    const stored = await chrome.storage.sync.get(SHORTCUT_STORAGE_KEY);
    const config = sanitizeShortcut(stored?.[SHORTCUT_STORAGE_KEY]);
    applyShortcutToForm(config);
    setShortcutStatus("Shortcut ready.");
  } catch (error) {
    console.error(error);
    applyShortcutToForm(DEFAULT_SHORTCUT);
    setShortcutStatus("Failed to load shortcut.", true);
  }
};
var saveShortcut = async (config) => {
  await chrome.storage.sync.set({ [SHORTCUT_STORAGE_KEY]: config });
};
shortcutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!keyInput.value.trim()) {
    setShortcutStatus("Please enter a shortcut key.", true);
    return;
  }
  const normalizedKey = keyInput.value.trim().toLowerCase().slice(0, 1);
  if (!/^[a-z0-9]$/.test(normalizedKey)) {
    setShortcutStatus("Use a letter or digit for the key.", true);
    return;
  }
  const nextShortcut = {
    ctrl: ctrlInput.checked,
    alt: altInput.checked,
    shift: shiftInput.checked,
    meta: metaInput.checked,
    key: normalizedKey
  };
  saveShortcutButton.disabled = true;
  setShortcutStatus("Saving shortcut...");
  try {
    await saveShortcut(nextShortcut);
    setShortcutStatus("Shortcut saved!");
  } catch (error) {
    console.error(error);
    setShortcutStatus("Failed to save shortcut.", true);
  } finally {
    saveShortcutButton.disabled = false;
  }
});
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && SHORTCUT_STORAGE_KEY in changes) {
    const change = changes[SHORTCUT_STORAGE_KEY];
    if (change?.newValue) {
      applyShortcutToForm(sanitizeShortcut(change.newValue));
      setShortcutStatus("Shortcut updated.");
    }
  }
});
highlightButton?.addEventListener("click", () => {
  highlightActiveTab();
});
loadShortcut();
//# sourceMappingURL=popup.js.map