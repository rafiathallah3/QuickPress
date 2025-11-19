// src/background.ts
var DEFAULT_SHORTCUT = {
  ctrl: true,
  alt: false,
  shift: false,
  meta: false,
  key: "q"
};
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    const stored = await chrome.storage.sync.get("shortcut");
    if (!stored.shortcut) {
      await chrome.storage.sync.set({ shortcut: DEFAULT_SHORTCUT });
    }
    console.log("QuickPress extension installed.");
  }
});
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.classList.toggle("quickpress-highlight")
    });
  } catch (error) {
    console.error("Failed to toggle highlight", error);
  }
});
//# sourceMappingURL=background.js.map