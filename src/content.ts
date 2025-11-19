export {};

const HIGHLIGHT_CLASS = "quickpress-highlight";
const BUTTON_HIGHLIGHT_CLASS = "quickpress-button-highlight";
const BUTTON_ACTIVE_CLASS = "quickpress-button-highlight-active";
const OVERLAY_ID = "quickpress-overlay";
const SHORTCUT_KEYS = "1234567890abcdefghijklmnopqrstuvwxyz";
const SHORTCUT_STORAGE_KEY = "shortcut";

type CommandTarget = HTMLElement & {
  click(): void;
};

type ShortcutConfig = {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
};

const DEFAULT_SHORTCUT: ShortcutConfig = {
  ctrl: true,
  alt: false,
  shift: false,
  meta: false,
  key: "q"
};

let shortcutConfig: ShortcutConfig = DEFAULT_SHORTCUT;

const styleEl = document.createElement("style");
styleEl.id = "quickpress-style";
styleEl.textContent = `
  .${HIGHLIGHT_CLASS} {
    transition: box-shadow 200ms ease-in-out, background 200ms ease-in-out;
    box-shadow: inset 0 0 0 4px rgba(37, 99, 235, 0.4);
    background: rgba(148, 197, 255, 0.2);
  }

  .${BUTTON_HIGHLIGHT_CLASS} {
    outline: 3px dashed rgba(37, 99, 235, 0.7) !important;
    outline-offset: 2px !important;
    position: relative;
  }

  .${BUTTON_ACTIVE_CLASS} {
    box-shadow: inset 0 0 0 4px rgba(37, 99, 235, 0.7),
      0 0 12px rgba(37, 99, 235, 0.6) !important;
    background: rgba(148, 197, 255, 0.45) !important;
  }

  #${OVERLAY_ID} {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 24px 16px 32px;
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
  }

  #${OVERLAY_ID} .quickpress-panel {
    background: #f8fafc;
    min-width: 320px;
    max-width: min(520px, 90vw);
    max-height: min(70vh, 520px);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  #${OVERLAY_ID} h2 {
    margin: 0;
    font-size: 18px;
    color: #0f172a;
  }

  #${OVERLAY_ID} p {
    margin: 0;
    font-size: 13px;
    color: #475569;
  }

  #${OVERLAY_ID} .quickpress-search {
    width: 100%;
    border: 1px solid #cbd5f5;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 120ms ease-in-out, box-shadow 120ms ease-in-out;
  }

  #${OVERLAY_ID} .quickpress-search:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }

  #${OVERLAY_ID} ul {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  #${OVERLAY_ID} li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    cursor: pointer;
    font-size: 14px;
    color: #0f172a;
    transition: background 120ms ease-in-out;
  }

  #${OVERLAY_ID} li:hover,
  #${OVERLAY_ID} li:focus-visible {
    background: #cbd5f5;
  }

  #${OVERLAY_ID} .quickpress-shortcut {
    background: #1d4ed8;
    color: #fff;
    font-weight: 600;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 12px;
  }
`;

if (!document.getElementById(styleEl.id)) {
  document.head.appendChild(styleEl);
}

const sanitizeShortcut = (value: unknown): ShortcutConfig => {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_SHORTCUT };
  }

  const candidate = value as Partial<ShortcutConfig> & { key?: string };
  const trimmedKey =
    typeof candidate.key === "string" && candidate.key.trim().length > 0
      ? candidate.key.trim().toLowerCase().slice(0, 1)
      : DEFAULT_SHORTCUT.key;

  return {
    ctrl: Boolean(candidate.ctrl),
    alt: Boolean(candidate.alt),
    shift: Boolean(candidate.shift),
    meta: Boolean(candidate.meta),
    key: trimmedKey
  };
};

const applyShortcutConfig = (value: unknown) => {
  shortcutConfig = sanitizeShortcut(value);
};

const loadShortcutConfig = () => {
  chrome.storage.sync.get(SHORTCUT_STORAGE_KEY, (result) => {
    applyShortcutConfig(result?.[SHORTCUT_STORAGE_KEY]);
  });
};

const normalizedEventKey = (value: string) =>
  value.length === 1 ? value.toLowerCase() : value.toLowerCase();

const matchesShortcut = (event: KeyboardEvent) => {
  const key = normalizedEventKey(event.key);
  return (
    Boolean(event.ctrlKey) === Boolean(shortcutConfig.ctrl) &&
    Boolean(event.altKey) === Boolean(shortcutConfig.alt) &&
    Boolean(event.shiftKey) === Boolean(shortcutConfig.shift) &&
    Boolean(event.metaKey) === Boolean(shortcutConfig.meta) &&
    key === shortcutConfig.key
  );
};

loadShortcutConfig();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && SHORTCUT_STORAGE_KEY in changes) {
    const change = changes[SHORTCUT_STORAGE_KEY];
    applyShortcutConfig(change?.newValue);
  }
});

const state: {
  overlay: HTMLDivElement | null;
  highlighted: CommandTarget[];
  activeIndex: number | null;
} = {
  overlay: null,
  highlighted: [],
  activeIndex: null
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "HIGHLIGHT") {
    document.body.classList.toggle(HIGHLIGHT_CLASS);
    sendResponse({ ok: true });
  }
});

const isTypingField = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "select"
  );
};

const collectTargets = (): CommandTarget[] => {
  const nodes = Array.from(
    document.querySelectorAll<CommandTarget>(
      "button, [role='button'], a[href]"
    )
  );

  return nodes.filter(
    (node) =>
      node instanceof HTMLElement &&
      node.offsetParent !== null &&
      !(node instanceof HTMLButtonElement && node.disabled)
  );
};

const resetHighlights = () => {
  state.highlighted.forEach((btn) => {
    btn.classList.remove(BUTTON_HIGHLIGHT_CLASS);
    btn.classList.remove(BUTTON_ACTIVE_CLASS);
  });
  state.highlighted = [];
  state.activeIndex = null;
};

const closeOverlay = () => {
  resetHighlights();
  state.overlay?.remove();
  state.overlay = null;
};

const executeButton = (index: number) => {
  const target = state.highlighted[index];
  if (!target) {
    return;
  }
  closeOverlay();
  target.focus({ preventScroll: false });
  target.click();
};

const setActiveHighlight = (index: number | null) => {
  if (state.activeIndex !== null) {
    state.highlighted[state.activeIndex]?.classList.remove(BUTTON_ACTIVE_CLASS);
  }
  state.activeIndex = index;
  if (index !== null) {
    state.highlighted[index]?.classList.add(BUTTON_ACTIVE_CLASS);
  }
};

const createListItem = (
  button: CommandTarget,
  index: number,
  shortcut: string | undefined
) => {
  const li = document.createElement("li");
  li.tabIndex = 0;
  li.dataset.index = String(index);
  if (shortcut) {
    li.dataset.shortcut = shortcut;
  }

  const label =
    button.innerText?.trim() ||
    button.getAttribute("aria-label") ||
    button.getAttribute("title") ||
    button.id ||
    (button instanceof HTMLAnchorElement
      ? button.getAttribute("href")
      : undefined) ||
    `Element ${index + 1}`;

  li.dataset.label = label.toLowerCase();

  const labelSpan = document.createElement("span");
  labelSpan.textContent = label;

  const shortcutSpan = document.createElement("span");
  shortcutSpan.className = "quickpress-shortcut";
  shortcutSpan.textContent = shortcut ?? "click";

  li.append(labelSpan, shortcutSpan);
  li.addEventListener("click", () => executeButton(index));
  li.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      executeButton(index);
    }
  });
  li.addEventListener("focus", () => setActiveHighlight(index));
  li.addEventListener("blur", () => setActiveHighlight(null));

  return li;
};

const openOverlay = () => {
  const buttons = collectTargets();
  if (buttons.length === 0) {
    closeOverlay();
    return;
  }

  buttons.forEach((btn) => btn.classList.add(BUTTON_HIGHLIGHT_CLASS));
  state.highlighted = buttons;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;

  const panel = document.createElement("div");
  panel.className = "quickpress-panel";

  const title = document.createElement("h2");
  title.textContent = "QuickPress Actions";

  const instructions = document.createElement("p");
  instructions.textContent =
    "Search by text, press the shortcut key, or click an item. Press Esc to cancel.";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Filter buttons and links...";
  searchInput.className = "quickpress-search";

  const list = document.createElement("ul");

  buttons.forEach((btn, index) => {
    const shortcut = SHORTCUT_KEYS[index];
    const item = createListItem(btn, index, shortcut);
    list.appendChild(item);
  });

  const filterList = (query: string) => {
    const normalized = query.trim().toLowerCase();
    list
      .querySelectorAll<HTMLLIElement>("li")
      .forEach((item) => {
        const label = item.dataset.label ?? "";
        const matches = !normalized || label.includes(normalized);
        item.style.display = matches ? "flex" : "none";
      });
  };

  searchInput.addEventListener("input", () => filterList(searchInput.value));

  panel.append(title, instructions, searchInput, list);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  state.overlay = overlay;

  requestAnimationFrame(() => searchInput.focus());
};

const toggleOverlay = () => {
  if (state.overlay) {
    closeOverlay();
  } else {
    openOverlay();
  }
};

document.addEventListener(
  "keydown",
  (event) => {
    if (event.defaultPrevented) {
      return;
    }

    if (state.overlay) {
      const key = event.key.toLowerCase();
      if (key === "escape") {
        event.preventDefault();
        closeOverlay();
        return;
      }

      if (
        !isTypingField(event.target) &&
        SHORTCUT_KEYS.includes(key)
      ) {
        const index = SHORTCUT_KEYS.indexOf(key);
        if (index > -1 && index < state.highlighted.length) {
          event.preventDefault();
          executeButton(index);
          return;
        }
      }
    }

    if (matchesShortcut(event)) {
      event.preventDefault();
      toggleOverlay();
    }
  },
  true
);
