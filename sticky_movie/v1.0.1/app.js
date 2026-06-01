const state = {
  player: null,
  playerReady: false,
  videoMode: "youtube",
  localVideoUrl: "",
  rowNumber: 0,
  sleepTime: 0,
  videoTimer: null,
  pendingVideoId: "",
  memo: {
    firstHalf: [],
    secondHalf: [],
    other: []
  },
  shortcutSettings: null,
  shortcutMap: new Map()
};

let currentReportMarkdown = "";

const CACHE_KEY = "sticky_movie_v1_0_1_cache";
const CACHE_VERSION = 1;
const CACHE_MAX_BYTES = 1024 * 1024;
let cacheSaveTimer = null;
let timeSyncTimer = null;
let seekSortMode = 0;

const videoIdInput = document.getElementById("videoId");
const localVideoFileInput = document.getElementById("localVideoFile");
const localVideoEl = document.getElementById("localVideo");
const markdownFileInput = document.getElementById("markdownFile");
const statusArea = document.getElementById("status");
const loadVideoButton = document.getElementById("loadVideoButton");
const buildMarkdownButton = document.getElementById("buildMarkdownButton");
const downloadMarkdownButton = document.getElementById("downloadMarkdownButton");
const cacheSaveButton = document.getElementById("cacheSaveButton");
const cacheLoadButton = document.getElementById("cacheLoadButton");
const cacheClearButton = document.getElementById("cacheClearButton");
const reportMarkdown = document.getElementById("reportMarkdown");
const section1HeaderToggle = document.getElementById("section1HeaderToggle");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsCloseButton = document.getElementById("settingsCloseButton");
const reportToggleTab = document.getElementById("reportToggleTab");
const reportOverlay = document.getElementById("reportOverlay");
const reportBackdrop = document.getElementById("reportBackdrop");
const reportCloseButton = document.getElementById("reportCloseButton");
const REPORT_BULLET_FIELD_IDS = [
  "reportSummary",
  "reportRegulation",
  "reportPreInterview",
  "reportGoodPoints",
  "reportSelfComment",
  "reportShared",
  "reportUnshared",
  "reportOther"
];
const COMMENT_TYPE_OPTIONS = ["開始", "反則", "再開", "得点", "負傷", "コメント"];
const SHORTCUT_ACTION_OPTIONS = [
  { value: "selectRadio", label: "ラジオを選択" },
  { value: "toggleCheckbox", label: "チェックをトグル" },
  { value: "setCheckbox", label: "チェックをON/OFF" },
  { value: "focusElement", label: "入力へフォーカス" },
  { value: "expandSelect", label: "プルダウンを展開" },
  { value: "clickButton", label: "ボタン実行" }
];
const DEFAULT_SHORTCUT_SETTINGS = {
  version: 1,
  enabled: true,
  allowInTextInput: true,
  preventBrowserDefault: true,
  bindings: [
    {
      combo: "Ctrl+Enter",
      action: "clickButton",
      target: "addCommentButton",
      value: "",
      description: "コメントを追加"
    },
    {
      combo: "Shift+J",
      action: "focusElement",
      target: "commentEvent",
      value: "",
      description: "事象へフォーカス"
    },
    {
      combo: "Shift+K",
      action: "expandSelect",
      target: "commentType",
      value: "",
      description: "種類プルダウンを展開"
    },
    {
      combo: "Shift+?",
      action: "focusElement",
      target: "comment",
      value: "",
      description: "コメントへフォーカス"
    },
    {
      combo: "Alt+1",
      action: "selectRadio",
      target: "commentCategory",
      value: "前半",
      description: "分類を前半にする"
    },
    {
      combo: "Alt+2",
      action: "selectRadio",
      target: "commentCategory",
      value: "後半",
      description: "分類を後半にする"
    },
    {
      combo: "Alt+3",
      action: "selectRadio",
      target: "commentCategory",
      value: "その他",
      description: "分類をその他にする"
    },
    {
      combo: "Alt+H",
      action: "selectRadio",
      target: "commentTeam",
      value: "ホーム",
      description: "チームをホームにする"
    },
    {
      combo: "Alt+V",
      action: "selectRadio",
      target: "commentTeam",
      value: "ビジター",
      description: "チームをビジターにする"
    },
    {
      combo: "Alt+T",
      action: "toggleCheckbox",
      target: "commentLabel:タックル",
      value: "",
      description: "タックルをトグル"
    },
    {
      combo: "Alt+M",
      action: "toggleCheckbox",
      target: "commentLabel:モール",
      value: "",
      description: "モールをトグル"
    },
    {
      combo: "Alt+R",
      action: "toggleCheckbox",
      target: "commentLabel:ラック",
      value: "",
      description: "ラックをトグル"
    },
    {
      combo: "Alt+P",
      action: "toggleCheckbox",
      target: "commentLabel:PK",
      value: "",
      description: "PKをトグル"
    },
    {
      combo: "Alt+F",
      action: "toggleCheckbox",
      target: "commentLabel:FK",
      value: "",
      description: "FKをトグル"
    },
    {
      combo: "Alt+S",
      action: "toggleCheckbox",
      target: "commentLabel:スクラム",
      value: "",
      description: "スクラムをトグル"
    },
    {
      combo: "Alt+L",
      action: "toggleCheckbox",
      target: "commentLabel:ラインアウト",
      value: "",
      description: "ラインアウトをトグル"
    },
    {
      combo: "Shift+T",
      action: "toggleCheckbox",
      target: "commentLabel:ターンオーバー",
      value: "",
      description: "ターンオーバーをトグル"
    }
  ]
};

const shortcutEnabledInput = document.getElementById("shortcutEnabled");
const shortcutAllowInTextInput = document.getElementById("shortcutAllowInText");
const shortcutOverrideBrowserInput = document.getElementById("shortcutOverrideBrowser");
const shortcutTableBody = document.getElementById("shortcutTableBody");
const shortcutAddRowButton = document.getElementById("shortcutAddRowButton");
const shortcutSubmitButton = document.getElementById("shortcutSubmitButton");
const shortcutResetButton = document.getElementById("shortcutResetButton");

function setStatus(message, isError = false) {
  statusArea.textContent = message;
  statusArea.style.color = isError ? "#b00020" : "#2f4858";
}

function setReportSource(value) {
  const sourceEl = document.getElementById("reportSource");
  if (!sourceEl) return;
  sourceEl.value = String(value || "").slice(0, 1000);
}

function getReportMarkdownValue() {
  if (reportMarkdown) return reportMarkdown.value;
  return currentReportMarkdown;
}

function setReportMarkdownValue(value) {
  currentReportMarkdown = String(value || "");
  if (reportMarkdown) reportMarkdown.value = currentReportMarkdown;
}

function splitLines(text) {
  return (text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function collectReportBulletFields() {
  const ret = {};
  for (let i = 0; i < REPORT_BULLET_FIELD_IDS.length; i++) {
    const fieldId = REPORT_BULLET_FIELD_IDS[i];
    const el = document.getElementById(fieldId);
    ret[fieldId] = el ? el.value : "";
  }
  return ret;
}

function applyReportBulletFields(fields) {
  const source = fields && typeof fields === "object" ? fields : {};
  for (let i = 0; i < REPORT_BULLET_FIELD_IDS.length; i++) {
    const fieldId = REPORT_BULLET_FIELD_IDS[i];
    const el = document.getElementById(fieldId);
    if (!el) continue;
    el.value = String(source[fieldId] || "");
  }
}

function escapeMdCell(value) {
  return String(value || "").replace(/\|/g, "\\|");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeVideoId(value) {
  const input = (value || "").trim();
  if (!input) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    if (url.hostname === "youtu.be") {
      return url.pathname.replace("/", "").slice(0, 11);
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.has("v")) return (url.searchParams.get("v") || "").slice(0, 11);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("embed");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].slice(0, 11);
    }
  } catch (_e) {
    return "";
  }
  return "";
}

function getCurrentOrigin() {
  return window.location.protocol === "file:" ? "" : window.location.origin;
}

function getVideoId() {
  return videoIdInput.value.trim();
}

function setVideoId(videoId) {
  videoIdInput.value = videoId || "";
}

function getSleepTime() {
  return Number(document.getElementById("sleepTime").value) || 0;
}

function getCurrentTime() {
  if (state.videoMode === "local" && localVideoEl) return localVideoEl.currentTime || 0;
  if (!state.playerReady || !state.player) return 0;
  return state.player.getCurrentTime();
}

function switchVideoMode(mode) {
  state.videoMode = mode === "local" ? "local" : "youtube";
  const ytEl = document.getElementById("player");

  if (ytEl) ytEl.style.display = state.videoMode === "youtube" ? "block" : "none";
  if (localVideoEl) localVideoEl.style.display = state.videoMode === "local" ? "block" : "none";
}

function loadLocalVideoFile(file) {
  if (!file) return;
  if (!localVideoEl) {
    setStatus("ローカル動画プレーヤーが見つかりません。", true);
    return;
  }

  if (state.localVideoUrl) {
    URL.revokeObjectURL(state.localVideoUrl);
    state.localVideoUrl = "";
  }

  const objectUrl = URL.createObjectURL(file);
  state.localVideoUrl = objectUrl;
  localVideoEl.src = objectUrl;
  localVideoEl.load();
  switchVideoMode("local");

  if (state.playerReady && state.player) state.player.pauseVideo();
  setVideoId("");
  setReportSource("local-video:" + file.name);
  setStatus("ローカル動画を読み込みました: " + file.name);
}

function formatSecondsLabel(seconds) {
  const safe = Number(seconds) || 0;
  const sec = safe < 0 ? 0 : safe;
  const minutes = Math.floor(sec / 60);
  const remain = Math.floor(sec % 60);
  const padded = String(remain).padStart(2, "0");
  return minutes + ":" + padded + " (" + sec.toFixed(1) + " s)";
}

function updateCurrentVideoTimeField() {
  const el = document.getElementById("currentVideoTime");
  if (!el) return;
  el.value = formatSecondsLabel(getCurrentTime());
}

function updateRowVideoTime(rowId) {
  const sleepEl = document.getElementById("sleep" + rowId);
  const labelEl = document.getElementById("videoTimeLabel" + rowId);
  if (!sleepEl || !labelEl) return;
  labelEl.textContent = formatSecondsLabel(Number(sleepEl.value) || 0);
}

function startTimeSyncTimer() {
  if (timeSyncTimer) clearInterval(timeSyncTimer);
  timeSyncTimer = setInterval(updateCurrentVideoTimeField, 250);
}

function getSelectedCommentCategory() {
  const selected = document.querySelector("input[name='commentCategory']:checked");
  const base = selected ? selected.value : "前半";
  if (base !== "その他") return base;
  const tagEl = document.getElementById("otherCategoryTag");
  const tag = tagEl ? tagEl.value.trim() : "";
  return tag ? "その他:" + tag : "その他";
}

function setSelectedCommentCategory(value) {
  const raw = String(value || "前半");
  const isOtherTagged = raw.startsWith("その他:");
  const category = raw === "後半" ? "後半" : (raw === "その他" || isOtherTagged ? "その他" : "前半");
  const target = document.querySelector("input[name='commentCategory'][value='" + category + "']");
  if (target) target.checked = true;
  const tagEl = document.getElementById("otherCategoryTag");
  if (tagEl) tagEl.value = isOtherTagged ? raw.slice("その他:".length) : "";
  updateOtherCategoryTagVisibility();
}

function getSelectedCommentTeam() {
  const selected = document.querySelector("input[name='commentTeam']:checked");
  return selected ? selected.value : "ホーム";
}

function setSelectedCommentTeam(value) {
  const team = value === "ビジター" ? "ビジター" : "ホーム";
  const target = document.querySelector("input[name='commentTeam'][value='" + team + "']");
  if (!target) return false;
  if (!target.checked) {
    target.checked = true;
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return true;
}

function getSelectedLabelTags() {
  const selected = document.querySelectorAll(".comment-label:checked");
  const tags = [];
  selected.forEach((el) => {
    const v = (el.value || "").trim();
    if (v) tags.push(v);
  });
  return tags;
}

function clearSelectedLabelTags() {
  document.querySelectorAll(".comment-label").forEach((el) => {
    el.checked = false;
  });
}

function buildCommentWithHashtags(rawComment, category, labels) {
  const base = String(rawComment || "").trim();
  const tokens = [];
  const cats = String(category || "").trim();

  if (cats.startsWith("その他:")) {
    const tag = cats.slice("その他:".length).trim();
    tokens.push("#その他");
    if (tag) tokens.push("#" + tag);
  } else if (cats) {
    tokens.push("#" + cats);
  }

  (labels || []).forEach((label) => {
    const l = String(label || "").trim();
    if (l) tokens.push("#" + l);
  });

  const unique = [];
  for (let i = 0; i < tokens.length; i++) {
    if (unique.includes(tokens[i])) continue;
    if (base.includes(tokens[i])) continue;
    unique.push(tokens[i]);
  }

  if (unique.length === 0) return base;
  return (base ? base + " " : "") + unique.join(" ");
}

function updateOtherCategoryTagVisibility() {
  const selected = document.querySelector("input[name='commentCategory']:checked");
  const tagEl = document.getElementById("otherCategoryTag");
  if (!tagEl) return;
  const show = !!(selected && selected.value === "その他");
  tagEl.style.display = show ? "block" : "none";
  if (!show) tagEl.value = "";
}

function cloneShortcutSettings(settings) {
  return {
    version: Number(settings && settings.version) || 1,
    enabled: settings ? !!settings.enabled : true,
    allowInTextInput: settings ? !!settings.allowInTextInput : true,
    preventBrowserDefault: settings ? !!settings.preventBrowserDefault : true,
    bindings: Array.isArray(settings && settings.bindings)
      ? settings.bindings.map((binding) => ({
        combo: String(binding.combo || ""),
        action: String(binding.action || ""),
        target: String(binding.target || ""),
        value: String(binding.value || ""),
        description: String(binding.description || "")
      }))
      : []
  };
}

function getDefaultShortcutSettings() {
  return cloneShortcutSettings(DEFAULT_SHORTCUT_SETTINGS);
}

function mergeMissingDefaultShortcutBindings(settings) {
  const merged = cloneShortcutSettings(settings);
  const defaults = getDefaultShortcutSettings();
  const currentBindings = Array.isArray(merged.bindings) ? merged.bindings : [];
  const currentCombos = new Set(currentBindings.map((b) => String(b.combo || "")).filter((combo) => combo.length > 0));

  const defaultBindings = Array.isArray(defaults.bindings) ? defaults.bindings : [];
  for (let i = 0; i < defaultBindings.length; i++) {
    const d = defaultBindings[i];
    const combo = String(d.combo || "");
    if (!combo || currentCombos.has(combo)) continue;
    currentBindings.push({ ...d });
    currentCombos.add(combo);
  }

  merged.bindings = currentBindings;
  return merged;
}

function normalizeShortcutComboText(comboText) {
  const raw = String(comboText || "").trim();
  if (!raw) return "";
  const parts = raw
    .replace(/\s+/g, "")
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return "";

  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;
  let key = "";

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].toLowerCase();
    if (p === "ctrl" || p === "control") ctrl = true;
    else if (p === "alt" || p === "option") alt = true;
    else if (p === "shift") shift = true;
    else if (p === "meta" || p === "cmd" || p === "command") meta = true;
    else key = parts[i];
  }

  const keyNorm = normalizeShortcutKeyToken(key);
  if (!keyNorm) return "";
  const ret = [];
  if (ctrl) ret.push("Ctrl");
  if (alt) ret.push("Alt");
  if (shift) ret.push("Shift");
  if (meta) ret.push("Meta");
  ret.push(keyNorm);
  return ret.join("+");
}

function normalizeShortcutKeyToken(rawKey) {
  const key = String(rawKey || "").trim();
  if (!key) return "";
  if (key.length === 1) return key.toUpperCase();
  const low = key.toLowerCase();
  const aliases = {
    "arrowup": "ArrowUp",
    "arrowdown": "ArrowDown",
    "arrowleft": "ArrowLeft",
    "arrowright": "ArrowRight",
    "space": "Space",
    " ": "Space",
    "esc": "Escape"
  };
  if (aliases[low]) return aliases[low];
  return key[0].toUpperCase() + key.slice(1);
}

function normalizeShortcutComboFromEvent(event) {
  const keyRaw = event.key === " " ? "Space" : event.key;
  const keyNorm = normalizeShortcutKeyToken(keyRaw);
  if (!keyNorm) return "";
  if (["Control", "Shift", "Alt", "Meta"].includes(keyNorm)) return "";

  const ret = [];
  if (event.ctrlKey) ret.push("Ctrl");
  if (event.altKey) ret.push("Alt");
  if (event.shiftKey) ret.push("Shift");
  if (event.metaKey) ret.push("Meta");
  ret.push(keyNorm);
  return ret.join("+");
}

function formatShortcutForHintDisplay(combo) {
  const parts = String(combo || "")
    .split("+")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "";

  const mapped = parts.map((p) => {
    const low = p.toLowerCase();
    if (low === "ctrl" || low === "control") return "C";
    if (low === "alt" || low === "option") return "A";
    if (low === "shift") return "S";
    if (low === "meta" || low === "cmd" || low === "command") return "M";
    if (p.length === 1) return p.toUpperCase();
    return p;
  });

  return mapped.join("+");
}

function buildShortcutHintToken(binding) {
  const action = String(binding && binding.action || "");
  const target = String(binding && binding.target || "");
  const value = String(binding && binding.value || "");
  if (!action || !target) return "";

  if (action === "selectRadio") return "radio:" + target + ":" + value;
  if (action === "toggleCheckbox" || action === "setCheckbox") return "checkbox:" + target;
  if (action === "focusElement") return "focus:" + target;
  if (action === "expandSelect") return "expand:" + target;
  if (action === "clickButton") return "button:" + target;
  return "";
}

function updateInlineShortcutHints(settings) {
  const map = new Map();
  const bindings = Array.isArray(settings && settings.bindings) ? settings.bindings : [];

  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    const token = buildShortcutHintToken(binding);
    if (!token) continue;
    const display = formatShortcutForHintDisplay(binding.combo);
    if (!display) continue;
    if (!map.has(token)) map.set(token, []);
    map.get(token).push(display);
  }

  const hintEls = document.querySelectorAll("[data-shortcut-for]");
  hintEls.forEach((el) => {
    const token = el.getAttribute("data-shortcut-for") || "";
    const values = map.get(token) || [];
    el.textContent = values.join(" / ");
  });
}

function getShortcutTargetCatalog() {
  const items = [
    {
      key: "addCommentButton",
      label: "コメント追加ボタン",
      kind: "button",
      elementId: "addCommentButton",
      values: []
    },
    {
      key: "commentEvent",
      label: "事象入力",
      kind: "focus",
      elementId: "commentEvent",
      values: []
    },
    {
      key: "comment",
      label: "コメント入力",
      kind: "focus",
      elementId: "comment",
      values: []
    },
    {
      key: "commentType",
      label: "種類入力（候補付き）",
      kind: "datalistInput",
      elementId: "commentType",
      values: []
    },
    {
      key: "commentCategory",
      label: "分類ラジオ",
      kind: "radio",
      radioName: "commentCategory",
      values: ["前半", "後半", "その他"]
    },
    {
      key: "commentTeam",
      label: "チームラジオ",
      kind: "radio",
      radioName: "commentTeam",
      values: ["ホーム", "ビジター"]
    }
  ];

  document.querySelectorAll(".comment-label").forEach((el) => {
    const value = String(el.value || "").trim();
    if (!value) return;
    items.push({
      key: "commentLabel:" + value,
      label: "ラベルチェック: " + value,
      kind: "checkbox",
      checkboxValue: value,
      values: ["on", "off"]
    });
  });

  return items;
}

function resolveShortcutTarget(targetKey) {
  const catalog = getShortcutTargetCatalog();
  for (let i = 0; i < catalog.length; i++) {
    if (catalog[i].key === targetKey) return catalog[i];
  }
  return null;
}

function createSelectOptions(select, options, selectedValue) {
  select.innerHTML = "";
  for (let i = 0; i < options.length; i++) {
    const opt = document.createElement("option");
    opt.value = options[i].value;
    opt.textContent = options[i].label;
    select.appendChild(opt);
  }
  select.value = selectedValue;
}

function createTargetSelect(selectedValue) {
  const select = document.createElement("select");
  const catalog = getShortcutTargetCatalog();
  const options = catalog.map((item) => ({ value: item.key, label: item.label }));
  if (options.length === 0) options.push({ value: "", label: "対象なし" });
  createSelectOptions(select, options, selectedValue);
  if (!select.value && options.length > 0) select.value = options[0].value;
  return select;
}

function captureShortcutComboIntoInput(inputEl) {
  inputEl.addEventListener("keydown", (event) => {
    event.preventDefault();
    const combo = normalizeShortcutComboFromEvent(event);
    if (!combo) return;
    inputEl.value = combo;
  });
}

function createShortcutBindingRow(binding) {
  const tr = document.createElement("tr");

  const comboTd = document.createElement("td");
  const comboInput = document.createElement("input");
  comboInput.type = "text";
  comboInput.className = "shortcut-combo-input";
  comboInput.placeholder = "例: Ctrl+R";
  comboInput.value = String(binding.combo || "");
  captureShortcutComboIntoInput(comboInput);
  comboTd.appendChild(comboInput);

  const actionTd = document.createElement("td");
  const actionSelect = document.createElement("select");
  createSelectOptions(actionSelect, SHORTCUT_ACTION_OPTIONS, String(binding.action || "toggleCheckbox"));
  actionTd.appendChild(actionSelect);

  const targetTd = document.createElement("td");
  const targetSelect = createTargetSelect(String(binding.target || ""));
  targetTd.appendChild(targetSelect);

  const valueTd = document.createElement("td");
  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.placeholder = "例: ホーム / on";
  valueInput.value = String(binding.value || "");
  valueTd.appendChild(valueInput);

  const descTd = document.createElement("td");
  const descInput = document.createElement("input");
  descInput.type = "text";
  descInput.placeholder = "説明";
  descInput.value = String(binding.description || "");
  descTd.appendChild(descInput);

  const deleteTd = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "secondary shortcut-row-delete";
  deleteBtn.textContent = "削除";
  deleteBtn.addEventListener("click", () => {
    tr.remove();
  });
  deleteTd.appendChild(deleteBtn);

  tr.appendChild(comboTd);
  tr.appendChild(actionTd);
  tr.appendChild(targetTd);
  tr.appendChild(valueTd);
  tr.appendChild(descTd);
  tr.appendChild(deleteTd);
  return tr;
}

function renderShortcutSettingsEditor(settings) {
  if (!shortcutTableBody || !shortcutEnabledInput || !shortcutAllowInTextInput || !shortcutOverrideBrowserInput) return;
  shortcutEnabledInput.checked = !!settings.enabled;
  shortcutAllowInTextInput.checked = !!settings.allowInTextInput;
  shortcutOverrideBrowserInput.checked = !!settings.preventBrowserDefault;
  shortcutTableBody.innerHTML = "";

  const bindings = Array.isArray(settings.bindings) ? settings.bindings : [];
  for (let i = 0; i < bindings.length; i++) {
    shortcutTableBody.appendChild(createShortcutBindingRow(bindings[i]));
  }
}

function appendEmptyShortcutBindingRow() {
  if (!shortcutTableBody) return;
  const catalog = getShortcutTargetCatalog();
  const defaultTarget = catalog.length > 0 ? catalog[0].key : "";
  shortcutTableBody.appendChild(createShortcutBindingRow({
    combo: "",
    action: "toggleCheckbox",
    target: defaultTarget,
    value: "",
    description: ""
  }));
}

function collectShortcutSettingsFromEditor() {
  const ret = {
    version: 1,
    enabled: !!(shortcutEnabledInput && shortcutEnabledInput.checked),
    allowInTextInput: !!(shortcutAllowInTextInput && shortcutAllowInTextInput.checked),
    preventBrowserDefault: !!(shortcutOverrideBrowserInput && shortcutOverrideBrowserInput.checked),
    bindings: []
  };
  if (!shortcutTableBody) return ret;

  const rows = Array.from(shortcutTableBody.querySelectorAll("tr"));
  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input, select");
    if (inputs.length < 5) return;
    const combo = normalizeShortcutComboText(inputs[0].value);
    const action = String(inputs[1].value || "");
    const target = String(inputs[2].value || "");
    const value = String(inputs[3].value || "").trim();
    const description = String(inputs[4].value || "").trim();
    if (!combo && !target && !value && !description) return;
    ret.bindings.push({ combo, action, target, value, description });
  });

  return ret;
}

function validateShortcutSettings(settings) {
  const issues = [];
  const seen = new Set();
  const bindings = Array.isArray(settings.bindings) ? settings.bindings : [];

  for (let i = 0; i < bindings.length; i++) {
    const row = bindings[i];
    const label = "行" + (i + 1);
    if (!row.combo) {
      issues.push(label + ": ショートカットが未入力です。");
      continue;
    }
    if (seen.has(row.combo)) issues.push(label + ": ショートカットが重複しています（" + row.combo + "）。");
    seen.add(row.combo);

    const targetMeta = resolveShortcutTarget(row.target);
    if (!targetMeta) {
      issues.push(label + ": 対象が無効です。");
      continue;
    }

    if (row.action === "selectRadio") {
      if (targetMeta.kind !== "radio") issues.push(label + ": selectRadio はラジオ対象でのみ利用できます。");
      if (!row.value) issues.push(label + ": selectRadio の値が未入力です。");
    } else if (row.action === "toggleCheckbox") {
      if (targetMeta.kind !== "checkbox") issues.push(label + ": toggleCheckbox はチェックボックス対象でのみ利用できます。");
    } else if (row.action === "setCheckbox") {
      if (targetMeta.kind !== "checkbox") issues.push(label + ": setCheckbox はチェックボックス対象でのみ利用できます。");
      if (!["on", "off", "true", "false", "1", "0"].includes(String(row.value || "").toLowerCase())) {
        issues.push(label + ": setCheckbox の値は on/off (true/false,1/0) を指定してください。");
      }
    } else if (row.action === "focusElement") {
      if (targetMeta.kind !== "focus") issues.push(label + ": focusElement は入力対象でのみ利用できます。");
    } else if (row.action === "expandSelect") {
      if (!["select", "datalistInput"].includes(targetMeta.kind)) {
        issues.push(label + ": expandSelect はプルダウン/候補付き入力対象でのみ利用できます。");
      }
    } else if (row.action === "clickButton") {
      if (targetMeta.kind !== "button") issues.push(label + ": clickButton はボタン対象でのみ利用できます。");
    } else {
      issues.push(label + ": action が未対応です。");
    }
  }

  return issues;
}

function rebuildShortcutMap(settings) {
  const map = new Map();
  const bindings = Array.isArray(settings.bindings) ? settings.bindings : [];
  for (let i = 0; i < bindings.length; i++) {
    const b = bindings[i];
    if (!b.combo) continue;
    map.set(b.combo, { ...b });
  }
  state.shortcutMap = map;
}

function applyShortcutSettings(settings, statusMessage) {
  const normalized = cloneShortcutSettings(settings);
  const issues = validateShortcutSettings(normalized);
  if (issues.length > 0) {
    setStatus("ショートカット設定エラー: " + issues[0], true);
    return false;
  }

  state.shortcutSettings = normalized;
  rebuildShortcutMap(normalized);
  renderShortcutSettingsEditor(normalized);
  updateInlineShortcutHints(normalized);
  if (statusMessage) setStatus(statusMessage);
  return true;
}

function isTextInputContext(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "select") return false;
  if (tag !== "input") return !!target.isContentEditable;

  const type = String(target.type || "text").toLowerCase();
  return !["button", "checkbox", "radio", "range", "file"].includes(type);
}

function executeShortcutBinding(binding) {
  const targetMeta = resolveShortcutTarget(binding.target);
  if (!targetMeta) return false;

  if (binding.action === "selectRadio") {
    const selector = "input[name='" + targetMeta.radioName + "'][value='" + binding.value + "']";
    const radio = document.querySelector(selector);
    if (!radio) return false;
    if (!radio.checked) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  }

  if (binding.action === "toggleCheckbox") {
    const selector = ".comment-label[value='" + targetMeta.checkboxValue + "']";
    const checkbox = document.querySelector(selector);
    if (!checkbox) return false;
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (binding.action === "setCheckbox") {
    const selector = ".comment-label[value='" + targetMeta.checkboxValue + "']";
    const checkbox = document.querySelector(selector);
    if (!checkbox) return false;
    const v = String(binding.value || "").toLowerCase();
    checkbox.checked = v === "on" || v === "true" || v === "1";
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (binding.action === "focusElement") {
    const target = document.getElementById(targetMeta.elementId);
    if (!target) return false;
    target.focus();
    if (typeof target.setSelectionRange === "function") {
      const v = String(target.value || "");
      target.setSelectionRange(v.length, v.length);
    }
    return true;
  }

  if (binding.action === "expandSelect") {
    const target = document.getElementById(targetMeta.elementId);
    if (!target) return false;

    if (target.tagName && target.tagName.toLowerCase() === "select") {
      if (!target.dataset.baseSize) target.dataset.baseSize = String(target.size || 1);
      const optionCount = Math.max(2, target.options ? target.options.length : 2);
      target.size = optionCount;
      target.classList.add("expanded");
      target.focus();
      return true;
    }

    target.focus();
    const current = String(target.value || "");
    target.value = "";
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.value = current;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    try {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    } catch (_e) {
      // noop
    }
    return true;
  }

  if (binding.action === "clickButton") {
    const btn = document.getElementById(targetMeta.elementId);
    if (!btn || typeof btn.click !== "function") return false;
    btn.click();
    return true;
  }

  return false;
}

function handleShortcutKeydown(event) {
  if (!state.shortcutSettings || !state.shortcutSettings.enabled) return;
  const activeEl = document.activeElement;
  if (activeEl && activeEl.classList && activeEl.classList.contains("shortcut-combo-input")) return;
  if (!state.shortcutSettings.allowInTextInput && isTextInputContext(event.target)) return;

  const combo = normalizeShortcutComboFromEvent(event);
  if (!combo) return;
  const binding = state.shortcutMap.get(combo);
  if (!binding) return;

  if (state.shortcutSettings.preventBrowserDefault) {
    event.preventDefault();
    event.stopPropagation();
  }

  const success = executeShortcutBinding(binding);
  if (success) {
    setStatus("ショートカット実行: " + combo + (binding.description ? " - " + binding.description : ""));
    scheduleCacheSave();
  } else {
    setStatus("ショートカット実行に失敗しました: " + combo, true);
  }
}

function setSelectedCommentText(value) {
  const table = document.getElementById("selectedCommentText");
  if (!table) return;
  const body = table.querySelector("tbody");
  if (!body) return;

  const cells = !value || typeof value !== "object" ? ["", "", "", "", ""] : [
    String(value.seek || "").trim(),
    String(value.videoTime || "").trim(),
    String(value.type || "").trim(),
    String(value.event || "").trim(),
    String(value.comment || "").trim()
  ];

  body.innerHTML = "<tr><td>" + escapeHtml(cells[0]) + "</td><td>" + escapeHtml(cells[1]) + "</td><td>" +
    escapeHtml(cells[2]) + "</td><td>" + escapeHtml(cells[3]) + "</td><td>" + escapeHtml(cells[4]) + "</td></tr>";
}

function getBaseCategoryForFilter(value) {
  const v = String(value || "");
  if (v.startsWith("その他")) return "その他";
  if (v === "前半" || v === "後半") return v;
  return "";
}

function applyCommentListTransforms() {
  const tbody = document.getElementById("commentTableBody");
  if (!tbody) return;

  const categoryFilterEl = document.getElementById("filterCategory");
  const typeFilterEl = document.getElementById("filterType");
  const eventFilterEl = document.getElementById("filterEvent");
  const commentFilterEl = document.getElementById("filterComment");
  const categoryFilter = categoryFilterEl ? categoryFilterEl.value : "";
  const typeFilter = typeFilterEl ? typeFilterEl.value.trim().toLowerCase() : "";
  const eventFilter = eventFilterEl ? eventFilterEl.value.trim().toLowerCase() : "";
  const commentFilter = commentFilterEl ? commentFilterEl.value.trim().toLowerCase() : "";

  const rows = [];
  for (let i = 0; i < state.rowNumber; i++) {
    const rowEl = document.getElementById("row" + i);
    if (!rowEl) continue;
    const seekEl = document.getElementById("seek" + i);
    rows.push({
      index: i,
      row: rowEl,
      seek: Number(seekEl ? seekEl.value : 0) || 0
    });
  }

  if (seekSortMode !== 0) {
    rows.sort((a, b) => {
      const diff = (a.seek - b.seek) * seekSortMode;
      return diff !== 0 ? diff : a.index - b.index;
    });
  }

  rows.forEach((item) => tbody.appendChild(item.row));

  rows.forEach((item) => {
    const i = item.index;
    const categoryEl = document.getElementById("category" + i);
    const typeEl = document.getElementById("type" + i);
    const eventEl = document.getElementById("event" + i);
    const commentEl = document.getElementById("comment" + i);
    const baseCategory = getBaseCategoryForFilter(categoryEl ? categoryEl.value : "");
    const typeValue = String(typeEl ? typeEl.value : "").toLowerCase();
    const eventValue = String(eventEl ? eventEl.value : "").toLowerCase();
    const commentValue = String(commentEl ? commentEl.value : "").toLowerCase();

    const matchCategory = !categoryFilter || baseCategory === categoryFilter;
    const matchType = !typeFilter || typeValue === typeFilter;
    const matchEvent = !eventFilter || eventValue.includes(eventFilter);
    const matchComment = !commentFilter || commentValue.includes(commentFilter);
    item.row.style.display = (matchCategory && matchType && matchEvent && matchComment) ? "" : "none";
  });
}

function refreshFilterTypeOptions() {
  const filterTypeEl = document.getElementById("filterType");
  if (!filterTypeEl) return;

  const current = String(filterTypeEl.value || "");
  const seen = new Set();
  const options = [];

  for (let i = 0; i < state.rowNumber; i++) {
    const rowEl = document.getElementById("row" + i);
    const typeEl = document.getElementById("type" + i);
    if (!rowEl || !typeEl) continue;
    const v = String(typeEl.value || "").trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    options.push(v);
  }

  filterTypeEl.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "すべて";
  filterTypeEl.appendChild(allOpt);

  for (let i = 0; i < options.length; i++) {
    const opt = document.createElement("option");
    opt.value = options[i];
    opt.textContent = options[i];
    filterTypeEl.appendChild(opt);
  }

  filterTypeEl.value = seen.has(current) ? current : "";
}

function updateSeekSortHeaderLabel() {
  const header = document.getElementById("commentTableHeadSeek");
  if (!header) return;
  if (seekSortMode === 1) header.textContent = "開始秒数 ▼";
  else if (seekSortMode === -1) header.textContent = "開始秒数 ▲";
  else header.textContent = "開始秒数";
}

function toggleSeekSortMode() {
  if (seekSortMode !== 1) seekSortMode = 1;
  else seekSortMode = -1;

  updateSeekSortHeaderLabel();
  applyCommentListTransforms();
}

function resetFilters() {
  const category = document.getElementById("filterCategory");
  const type = document.getElementById("filterType");
  const event = document.getElementById("filterEvent");
  const comment = document.getElementById("filterComment");

  if (category) category.value = "";
  if (type) type.value = "";
  if (event) event.value = "";
  if (comment) comment.value = "";

  applyCommentListTransforms();
}

function resetCommentTable() {
  const ct = document.getElementById("commentTable");
  ct.innerHTML = "";
  const table = document.createElement("table");
  table.innerHTML = "<thead><tr><th id=\"commentTableHeadSeek\" class=\"sortable-seek\">開始秒数</th><th>再生秒数</th><th>動画再生時間（動画に連動）</th><th>種類</th><th>事象</th><th>コメント</th><th>再生</th><th>削除</th></tr></thead><tbody id=\"commentTableBody\"></tbody>";
  ct.appendChild(table);
  const seekHeader = document.getElementById("commentTableHeadSeek");
  if (seekHeader) seekHeader.addEventListener("click", toggleSeekSortMode);
  updateSeekSortHeaderLabel();
  state.rowNumber = 0;
  refreshFilterTypeOptions();
}

function loadYouTubeVideo(rawInput, options = {}) {
  const settings = { autoplay: false, ...options };
  const videoId = normalizeVideoId(rawInput);
  if (!videoId) {
    setStatus("YouTube動画IDまたはURLを正しく入力してください。", true);
    return;
  }
  setVideoId(videoId);
  setReportSource("https://www.youtube.com/watch?v=" + videoId);
  switchVideoMode("youtube");
  if (localVideoEl) localVideoEl.pause();

  if (!state.playerReady || !state.player) {
    state.pendingVideoId = videoId;
    setStatus("YouTubeプレーヤー準備中です。準備完了後に動画を読み込みます。");
    return;
  }

  state.player.cueVideoById({ videoId });
  if (settings.autoplay) state.player.playVideo();
  setStatus("動画を読み込みました: " + videoId);
}

function playByValues(seek, sleep) {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  const seekValue = Number(seek) || 0;
  const sleepValue = Number(sleep) || 0;
  state.sleepTime = sleepValue;

  clearTimeout(state.videoTimer);

  if (state.videoMode === "local" && localVideoEl) {
    localVideoEl.currentTime = seekValue;
    localVideoEl.play().catch(() => {
      setStatus("ローカル動画の再生に失敗しました。", true);
    });
    if (sleepValue > 0) {
      state.videoTimer = setTimeout(() => {
        localVideoEl.pause();
        state.sleepTime = 0;
      }, sleepValue * 1000);
    }
    return;
  }

  if (!state.playerReady || !state.player) {
    setStatus("YouTubeプレーヤーの準備が完了していません。", true);
    return;
  }
  state.player.seekTo(seekValue);
  state.player.playVideo();
}

function backVideo() {
  if (!state.playerReady || !state.player) {
    setStatus("YouTubeプレーヤーの準備が完了していません。", true);
    return;
  }
  let seek = getCurrentTime() - getSleepTime();
  if (seek < 0) seek = 0;
  state.player.seekTo(seek);
}

function addVideoCell(row, id, val, kind = "text") {
  const td = row.insertCell();
  if (kind === "type-select") {
    const select = document.createElement("select");
    select.id = id;

    const value = String(val == null ? "" : val).trim();
    const options = COMMENT_TYPE_OPTIONS.slice();
    if (value && !options.includes(value)) options.push(value);

    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "";
    select.appendChild(emptyOpt);

    for (let i = 0; i < options.length; i++) {
      const opt = document.createElement("option");
      opt.value = options[i];
      opt.textContent = options[i];
      select.appendChild(opt);
    }
    select.value = value;
    td.appendChild(select);
    return;
  }
  if (kind === "textarea") {
    const area = document.createElement("textarea");
    area.id = id;
    area.value = val == null ? "" : val;
    area.style.minHeight = "48px";
    td.appendChild(area);
    return;
  }
  const input = document.createElement("input");
  input.id = id;
  input.type = kind;
  input.value = val == null ? "" : val;
  td.appendChild(input);
}

function sanitizeMemoRow(row) {
  if (!row || typeof row !== "object") return null;
  const r = {
    time: String(row.time || "").slice(0, 80),
    event: String(row.event || "").slice(0, 300),
    type: String(row.type || "").slice(0, 80),
    comment: String(row.comment || "").slice(0, 5000),
    seek: row.seek == null ? null : Number(row.seek),
    sleep: row.sleep == null ? null : Number(row.sleep)
  };
  if (Number.isNaN(r.seek)) r.seek = null;
  if (Number.isNaN(r.sleep)) r.sleep = null;
  return r;
}

function addMemoRow(category, row) {
  const item = sanitizeMemoRow(row);
  if (!item) return;
  if (category === "前半") state.memo.firstHalf.push(item);
  else if (category === "後半") state.memo.secondHalf.push(item);
  else state.memo.other.push(item);
  renderMemoTables();
}

function removeMemoRow(category, index) {
  if (category === "前半") state.memo.firstHalf.splice(index, 1);
  else if (category === "後半") state.memo.secondHalf.splice(index, 1);
  else state.memo.other.splice(index, 1);
  renderMemoTables();
}

function renderMemoBody(category, bodyId) {
  const rows = category === "前半" ? state.memo.firstHalf : category === "後半" ? state.memo.secondHalf : state.memo.other;
  const body = document.getElementById(bodyId);
  if (!body) return;
  body.innerHTML = "";

  for (let i = 0; i < rows.length; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + escapeHtml(rows[i].time) + "</td>" +
      "<td>" + escapeHtml(rows[i].event) + "</td>" +
      "<td>" + escapeHtml(rows[i].type) + "</td>" +
      "<td>" + escapeHtml(rows[i].comment) + "</td>";

    const playTd = document.createElement("td");
    const pBtn = document.createElement("button");
    pBtn.type = "button";
    pBtn.className = "secondary";
    pBtn.textContent = rows[i].seek != null ? "動画再生" : "未連携";
    pBtn.disabled = rows[i].seek == null;
    pBtn.onclick = () => {
      const item = rows[i];
      if (item && item.seek != null) playByValues(item.seek, item.sleep);
    };
    playTd.appendChild(pBtn);

    const deleteTd = document.createElement("td");
    const dBtn = document.createElement("button");
    dBtn.type = "button";
    dBtn.className = "secondary";
    dBtn.textContent = "削除";
    dBtn.onclick = () => removeMemoRow(category, i);
    deleteTd.appendChild(dBtn);

    tr.appendChild(playTd);
    tr.appendChild(deleteTd);
    body.appendChild(tr);
  }
}

function renderMemoTables() {
  renderMemoBody("前半", "firstMemoBody");
  renderMemoBody("後半", "secondMemoBody");
  renderMemoBody("その他", "otherMemoBody");
}

function clearCommentInputsAfterAdd() {
  const commentType = document.getElementById("commentType");
  const commentEvent = document.getElementById("commentEvent");
  const comment = document.getElementById("comment");
  if (commentType) commentType.value = "";
  if (commentEvent) commentEvent.value = "";
  if (comment) comment.value = "";
  clearSelectedLabelTags();
}

function addRow(seekTime, sleepTime, commentText, overrideCategory, overrideEvent, overrideType) {
  const isManualAdd =
    seekTime == null &&
    sleepTime == null &&
    commentText == null &&
    overrideCategory == null &&
    overrideEvent == null &&
    overrideType == null;

  const seek = seekTime != null ? Number(seekTime) : getCurrentTime();
  const sleep = sleepTime != null ? Number(sleepTime) : getSleepTime();
  const rawComment = commentText != null ? commentText : document.getElementById("comment").value;
  const category = overrideCategory || getSelectedCommentCategory();
  const labels = isManualAdd ? getSelectedLabelTags() : [];
  const comment = buildCommentWithHashtags(rawComment, category, labels);
  const eventName = overrideEvent != null ? overrideEvent : document.getElementById("commentEvent").value.trim();
  const eventType = overrideType != null ? overrideType : document.getElementById("commentType").value;

  const table = document.getElementById("commentTableBody");
  const row = table.insertRow();
  const id = state.rowNumber;
  row.id = "row" + id;

  addVideoCell(row, "seek" + id, seek, "number");
  addVideoCell(row, "sleep" + id, sleep, "number");

  const linkedTimeCell = row.insertCell();
  const linkedTimeLabel = document.createElement("span");
  linkedTimeLabel.id = "videoTimeLabel" + id;
  linkedTimeLabel.textContent = formatSecondsLabel(sleep);
  linkedTimeCell.appendChild(linkedTimeLabel);

  addVideoCell(row, "type" + id, eventType, "type-select");
  addVideoCell(row, "event" + id, eventName, "text");
  addVideoCell(row, "comment" + id, comment, "textarea");

  const hiddenMetaCell = row.insertCell();
  hiddenMetaCell.style.display = "none";
  const hiddenCategory = document.createElement("input");
  hiddenCategory.type = "hidden";
  hiddenCategory.id = "category" + id;
  hiddenCategory.value = category;
  hiddenMetaCell.appendChild(hiddenCategory);

  const seekInput = document.getElementById("seek" + id);
  if (seekInput) {
    seekInput.addEventListener("input", () => {
      applyCommentListTransforms();
      scheduleCacheSave();
    });
  }

  const sleepInput = document.getElementById("sleep" + id);
  if (sleepInput) {
    sleepInput.addEventListener("input", () => {
      updateRowVideoTime(id);
      scheduleCacheSave();
    });
  }

  const typeInput = document.getElementById("type" + id);
  const eventInput = document.getElementById("event" + id);
  if (typeInput) {
    typeInput.addEventListener("change", () => {
      refreshFilterTypeOptions();
      applyCommentListTransforms();
      scheduleCacheSave();
    });
  }
  if (eventInput) eventInput.addEventListener("input", applyCommentListTransforms);

  const playTd = row.insertCell();
  const playBtn = document.createElement("button");
  playBtn.type = "button";
  playBtn.textContent = "再生";
  playBtn.onclick = () => {
    const seekEl = document.getElementById("seek" + id);
    const sleepEl = document.getElementById("sleep" + id);
    const typeEl = document.getElementById("type" + id);
    const eventEl = document.getElementById("event" + id);
    const commentEl = document.getElementById("comment" + id);
    if (!seekEl || !sleepEl) return;
    setSelectedCommentText({
      seek: seekEl.value,
      videoTime: sleepEl.value,
      type: typeEl ? typeEl.value : "",
      event: eventEl ? eventEl.value : "",
      comment: commentEl ? commentEl.value : ""
    });
    playByValues(seekEl.value, sleepEl.value);
  };
  playTd.appendChild(playBtn);

  const deleteTd = row.insertCell();
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "secondary";
  delBtn.textContent = "削除";
  delBtn.onclick = () => {
    const target = document.getElementById("row" + id);
    if (target) {
      target.remove();
      refreshFilterTypeOptions();
      applyCommentListTransforms();
    }
  };
  deleteTd.appendChild(delBtn);

  addMemoRow(category, {
    time: Math.floor(Number(seek) || 0),
    event: eventName,
    type: eventType,
    comment,
    seek,
    sleep
  });

  state.rowNumber++;
  refreshFilterTypeOptions();
  if (isManualAdd) clearCommentInputsAfterAdd();
  applyCommentListTransforms();
  scheduleCacheSave();
}

function getComments() {
  const ret = {};
  let idx = 0;
  for (let i = 0; i < state.rowNumber; i++) {
    const seekEl = document.getElementById("seek" + i);
    const sleepEl = document.getElementById("sleep" + i);
    const commentEl = document.getElementById("comment" + i);
    const categoryEl = document.getElementById("category" + i);
    const eventEl = document.getElementById("event" + i);
    const typeEl = document.getElementById("type" + i);
    if (!seekEl || !sleepEl || !commentEl) continue;
    ret[idx] = {
      seek: seekEl.value,
      sleep: sleepEl.value,
      comment: commentEl.value,
      category: categoryEl ? categoryEl.value : "",
      event: eventEl ? eventEl.value : "",
      type: typeEl ? typeEl.value : ""
    };
    idx++;
  }
  return ret;
}

function makeJSON() {
  return {
    video_id: getVideoId(),
    comments: getComments(),
    report_bullets: collectReportBulletFields()
  };
}

function downloadJSON() {
  const filename = (normalizeVideoId(getVideoId()) || "sticky_movie") + ".json";
  const data = JSON.stringify(makeJSON());
  const link = document.createElement("a");
  link.href = "data:text/plain," + encodeURIComponent(data);
  link.download = filename;
  link.click();
  setStatus("JSONを保存しました: " + filename);
  scheduleCacheSave();
}

async function loadLocalJsonFile(file) {
  if (!file) return;
  let raw;
  try {
    raw = await file.text();
  } catch (_e) {
    setStatus("ローカルファイルの読み込みに失敗しました。", true);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_e) {
    setStatus("JSON形式が不正です。", true);
    return;
  }

  const normalizedVideoId = normalizeVideoId(parsed.video_id);
  if (!normalizedVideoId || typeof parsed.comments !== "object" || parsed.comments === null) {
    setStatus("JSONの形式が想定と異なります。", true);
    return;
  }

  setVideoId(normalizedVideoId);
  resetCommentTable();
  state.memo.firstHalf = [];
  state.memo.secondHalf = [];
  state.memo.other = [];

  const keys = Object.keys(parsed.comments).sort((a, b) => Number(a) - Number(b));
  for (let i = 0; i < keys.length; i++) {
    const row = parsed.comments[keys[i]];
    if (!row) continue;
    addRow(row.seek, row.sleep, row.comment, row.category || "前半", row.event || "", row.type || "");
  }

  if (parsed.report_bullets && typeof parsed.report_bullets === "object") {
    applyReportBulletFields(parsed.report_bullets);
  }

  loadYouTubeVideo(normalizedVideoId, { autoplay: false });
  setReportSource("local-file:" + file.name);
  setStatus("ローカルファイルを読み込みました: " + file.name);
}

function buildBulletSection(title, items) {
  let section = "## " + title + "\n\n";
  if (!items || items.length === 0) {
    section += "- (未記入)\n\n";
    return section;
  }
  for (let i = 0; i < items.length; i++) section += "- " + items[i] + "\n";
  section += "\n";
  return section;
}

function buildTimelineSection(title, rows) {
  let section = "### " + title + "\n\n";
  section += "| 時間 | 事象 | 種類 | コメント |\n";
  section += "| ---- | ---- | ---- | -------- |\n";
  if (!rows || rows.length === 0) {
    section += "|  |  |  |  |\n\n";
    return section;
  }
  for (let i = 0; i < rows.length; i++) {
    section += "| " + escapeMdCell(rows[i].time) + " | " +
      escapeMdCell(rows[i].event) + " | " +
      escapeMdCell(rows[i].type) + " | " +
      escapeMdCell(rows[i].comment) + " |\n";
  }
  section += "\n";
  return section;
}

function formatOtherMemoLabel(row) {
  return ("[" + (row.time || "") + "] " + (row.event || "") +
    (row.type ? " (" + row.type + ")" : "") +
    (row.comment ? " : " + row.comment : "")).trim();
}

function makeReportMarkdown() {
  const title = (document.getElementById("reportTitle").value || "レフリーコーチレポート").trim();
  const ko = (document.getElementById("reportKo").value || "").replace("T", " ");
  const venue = document.getElementById("reportVenue").value.trim();
  const weather = document.getElementById("reportWeather").value.trim();
  const referee = document.getElementById("reportReferee").value.trim();
  const coach = document.getElementById("reportCoach").value.trim();
  const source = document.getElementById("reportSource").value.trim();

  let md = "# " + title + "\n\n";
  if (ko) md += "- " + ko + " KO\n";
  if (venue) md += "- " + venue + "\n";
  if (weather) md += "- " + weather + "\n";
  if (referee) md += "- レフリー：" + referee + "\n";
  if (coach) md += "- コーチ：" + coach + "\n";
  if (source) md += "- 記録ソース：" + source + "\n";
  md += "\n";

  md += buildBulletSection("サマリ", splitLines(document.getElementById("reportSummary").value));
  md += buildBulletSection("レギュレーション", splitLines(document.getElementById("reportRegulation").value));
  md += "---\n\n";
  md += buildBulletSection("事前課題ヒアリング", splitLines(document.getElementById("reportPreInterview").value));
  md += "---\n\n";
  md += buildBulletSection("良かった点", splitLines(document.getElementById("reportGoodPoints").value));

  const selfComments = splitLines(document.getElementById("reportSelfComment").value);
  if (selfComments.length > 0) {
    md += "### 本人のコメント\n\n";
    for (let i = 0; i < selfComments.length; i++) md += "- " + selfComments[i] + "\n";
    md += "\n";
  }

  md += buildBulletSection("直接伝達済み", splitLines(document.getElementById("reportShared").value));
  md += buildBulletSection("未伝達", splitLines(document.getElementById("reportUnshared").value));
  md += "---\n\n";
  md += "## 試合進行メモ ※ 時間は切り捨て\n\n";
  md += buildTimelineSection("前半", state.memo.firstHalf);
  md += buildTimelineSection("後半", state.memo.secondHalf);

  const otherCombined = splitLines(document.getElementById("reportOther").value);
  for (let i = 0; i < state.memo.other.length; i++) {
    const label = formatOtherMemoLabel(state.memo.other[i]);
    if (label && !otherCombined.includes(label)) otherCombined.push(label);
  }
  md += buildBulletSection("その他", otherCombined);
  md += "以上\n";

  return md;
}

function parseBulletSection(md, title) {
  const regex = new RegExp("##\\s+" + title + "[\\s\\S]*?(?=\\n##\\s+|\\n###\\s+|\\n---|\\s*$)");
  const found = md.match(regex);
  if (!found) return [];
  return found[0]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((line) => line && line !== "(未記入)");
}

function parseTimeToSeconds(value) {
  const input = String(value || "").trim();
  if (!input) return null;
  if (/^\d+(?:\.\d+)?$/.test(input)) return Number(input);

  const parts = input.split(":").map((part) => part.trim());
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;

  let total = 0;
  for (let i = 0; i < parts.length; i++) total = total * 60 + Number(parts[i]);
  return total;
}

function parseTimelineSection(md, title) {
  const regex = new RegExp("###\\s+" + title + "[\\s\\S]*?(?=\\n###\\s+|\\n##\\s+|\\s*$)");
  const found = md.match(regex);
  if (!found) return [];
  const lines = found[0].split(/\r?\n/);
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|") || line.includes("----") || line.includes("時間")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    const seek = parseTimeToSeconds(cells[0]);
    const sleep = seek == null ? null : getSleepTime();
    if (cells.length >= 4) rows.push({ time: cells[0], event: cells[1], type: cells[2], comment: cells[3], seek, sleep });
    else if (cells.length === 3) rows.push({ time: cells[0], event: cells[1], type: "", comment: cells[2], seek, sleep });
  }
  return rows;
}

function parseOtherSection(md) {
  const items = parseBulletSection(md, "その他");
  const notes = [];
  const memoRows = [];

  for (let i = 0; i < items.length; i++) {
    const line = items[i];
    const match = line.match(/^\[(.*?)\]\s*(.*)$/);
    if (!match) {
      notes.push(line);
      continue;
    }

    const time = match[1].trim();
    let remaining = match[2].trim();
    let comment = "";
    const separatorIndex = remaining.indexOf(" : ");
    if (separatorIndex >= 0) {
      comment = remaining.slice(separatorIndex + 3).trim();
      remaining = remaining.slice(0, separatorIndex).trim();
    }

    let type = "";
    const typeMatch = remaining.match(/^(.*)\s+\(([^()]+)\)$/);
    if (typeMatch) {
      remaining = typeMatch[1].trim();
      type = typeMatch[2].trim();
    }

    memoRows.push({
      time,
      event: remaining,
      type,
      comment,
      seek: parseTimeToSeconds(time),
      sleep: parseTimeToSeconds(time) == null ? null : getSleepTime()
    });
  }

  return { notes, memoRows };
}

function rebuildCommentsFromMemo(parsedMemo) {
  resetCommentTable();
  state.memo.firstHalf = [];
  state.memo.secondHalf = [];
  state.memo.other = [];

  parsedMemo.firstHalf.forEach((row) => addRow(row.seek, row.sleep, row.comment, "前半", row.event, row.type));
  parsedMemo.secondHalf.forEach((row) => addRow(row.seek, row.sleep, row.comment, "後半", row.event, row.type));
  parsedMemo.other.forEach((row) => addRow(row.seek, row.sleep, row.comment, "その他", row.event, row.type));
}

function loadReportFromMarkdown(md, options = {}) {
  setReportMarkdownValue(md);
  setVideoId("");
  document.getElementById("reportTitle").value = "レフリーコーチレポート";
  document.getElementById("reportKo").value = "";
  document.getElementById("reportVenue").value = "";
  document.getElementById("reportWeather").value = "";
  document.getElementById("reportReferee").value = "";
  document.getElementById("reportCoach").value = "";
  document.getElementById("reportSource").value = "";
  document.getElementById("reportSummary").value = "";
  document.getElementById("reportRegulation").value = "";
  document.getElementById("reportPreInterview").value = "";
  document.getElementById("reportGoodPoints").value = "";
  document.getElementById("reportSelfComment").value = "";
  document.getElementById("reportShared").value = "";
  document.getElementById("reportUnshared").value = "";
  document.getElementById("reportOther").value = "";

  const titleMatch = md.match(/^#\s+(.+)$/m);
  if (titleMatch) document.getElementById("reportTitle").value = titleMatch[1].trim();

  const lines = md.match(/^-[^\n]+$/gm) || [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/^-\s*/, "").trim();
    if (line.endsWith("KO")) {
      const ko = line.replace(/\s*KO$/, "").trim();
      const m = ko.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
      if (m) document.getElementById("reportKo").value = m[1] + "T" + m[2];
    } else if (line.startsWith("レフリー：") || line.startsWith("レフリー:")) {
      document.getElementById("reportReferee").value = line.split(/[：:]/).slice(1).join(":").trim();
    } else if (line.startsWith("コーチ：") || line.startsWith("コーチ:")) {
      document.getElementById("reportCoach").value = line.split(/[：:]/).slice(1).join(":").trim();
    } else if (line.startsWith("記録ソース：") || line.startsWith("記録ソース:")) {
      document.getElementById("reportSource").value = line.split(/[：:]/).slice(1).join(":").trim();
    } else if (!document.getElementById("reportVenue").value) {
      document.getElementById("reportVenue").value = line;
    } else if (!document.getElementById("reportWeather").value) {
      document.getElementById("reportWeather").value = line;
    }
  }

  const loadedBullets = {
    reportSummary: parseBulletSection(md, "サマリ").join("\n"),
    reportRegulation: parseBulletSection(md, "レギュレーション").join("\n"),
    reportPreInterview: parseBulletSection(md, "事前課題ヒアリング").join("\n"),
    reportGoodPoints: parseBulletSection(md, "良かった点").join("\n"),
    reportShared: parseBulletSection(md, "直接伝達済み").join("\n"),
    reportUnshared: parseBulletSection(md, "未伝達").join("\n")
  };
  const otherSection = parseOtherSection(md);
  const otherBullets = otherSection.notes.slice();
  for (let i = 0; i < otherSection.memoRows.length; i++) {
    const label = formatOtherMemoLabel(otherSection.memoRows[i]);
    if (label && !otherBullets.includes(label)) otherBullets.push(label);
  }
  loadedBullets.reportOther = otherBullets.join("\n");

  const self = md.match(/###\s+本人のコメント[\s\S]*?(?=\n##\s+|\n###\s+|\n---|\s*$)/);
  if (self) {
    const selfLines = self[0]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim());
    loadedBullets.reportSelfComment = selfLines.join("\n");
  }
  applyReportBulletFields(loadedBullets);

  const parsedMemo = {
    firstHalf: parseTimelineSection(md, "前半"),
    secondHalf: parseTimelineSection(md, "後半"),
    other: otherSection.memoRows
  };
  rebuildCommentsFromMemo(parsedMemo);

  const sourceValue = document.getElementById("reportSource").value.trim();
  const videoId = normalizeVideoId(sourceValue);
  if (videoId) loadYouTubeVideo(videoId, { autoplay: false });
  else if (!sourceValue && options.fallbackSource) setReportSource(options.fallbackSource);

  setStatus("Markdownを読み込みました。必要に応じて修正して再生成してください。");
  scheduleCacheSave();
}

function collectFormState() {
  return {
    videoId: getVideoId(),
    sleepTime: document.getElementById("sleepTime").value,
    comment: document.getElementById("comment").value,
    commentEvent: document.getElementById("commentEvent").value,
    commentType: document.getElementById("commentType").value,
    commentCategory: getSelectedCommentCategory(),
    commentTeam: getSelectedCommentTeam(),
    commentLabels: getSelectedLabelTags(),
    reportTitle: document.getElementById("reportTitle").value,
    reportKo: document.getElementById("reportKo").value,
    reportVenue: document.getElementById("reportVenue").value,
    reportWeather: document.getElementById("reportWeather").value,
    reportReferee: document.getElementById("reportReferee").value,
    reportCoach: document.getElementById("reportCoach").value,
    reportSource: document.getElementById("reportSource").value,
    reportSummary: document.getElementById("reportSummary").value,
    reportRegulation: document.getElementById("reportRegulation").value,
    reportPreInterview: document.getElementById("reportPreInterview").value,
    reportGoodPoints: document.getElementById("reportGoodPoints").value,
    reportSelfComment: document.getElementById("reportSelfComment").value,
    reportShared: document.getElementById("reportShared").value,
    reportUnshared: document.getElementById("reportUnshared").value,
    reportOther: document.getElementById("reportOther").value,
    reportMarkdown: getReportMarkdownValue(),
    comments: getComments(),
    memo: {
      firstHalf: state.memo.firstHalf,
      secondHalf: state.memo.secondHalf,
      other: state.memo.other
    },
    shortcutSettings: cloneShortcutSettings(state.shortcutSettings || getDefaultShortcutSettings())
  };
}

function applyFormState(formState) {
  if (!formState || typeof formState !== "object") return;

  setVideoId(String(formState.videoId || ""));
  document.getElementById("sleepTime").value = String(formState.sleepTime || "10");
  document.getElementById("comment").value = String(formState.comment || "");
  document.getElementById("commentEvent").value = String(formState.commentEvent || "");
  document.getElementById("commentType").value = String(formState.commentType || "");
  setSelectedCommentCategory(String(formState.commentCategory || "前半"));
  setSelectedCommentTeam(String(formState.commentTeam || "ホーム"));
  clearSelectedLabelTags();
  if (Array.isArray(formState.commentLabels)) {
    const selected = formState.commentLabels.map((v) => String(v));
    document.querySelectorAll(".comment-label").forEach((el) => {
      el.checked = selected.includes(el.value);
    });
  }

  document.getElementById("reportTitle").value = String(formState.reportTitle || "レフリーコーチレポート");
  document.getElementById("reportKo").value = String(formState.reportKo || "");
  document.getElementById("reportVenue").value = String(formState.reportVenue || "");
  document.getElementById("reportWeather").value = String(formState.reportWeather || "");
  document.getElementById("reportReferee").value = String(formState.reportReferee || "");
  document.getElementById("reportCoach").value = String(formState.reportCoach || "");
  document.getElementById("reportSource").value = String(formState.reportSource || "");

  document.getElementById("reportSummary").value = String(formState.reportSummary || "");
  document.getElementById("reportRegulation").value = String(formState.reportRegulation || "");
  document.getElementById("reportPreInterview").value = String(formState.reportPreInterview || "");
  document.getElementById("reportGoodPoints").value = String(formState.reportGoodPoints || "");
  document.getElementById("reportSelfComment").value = String(formState.reportSelfComment || "");
  document.getElementById("reportShared").value = String(formState.reportShared || "");
  document.getElementById("reportUnshared").value = String(formState.reportUnshared || "");
  document.getElementById("reportOther").value = String(formState.reportOther || "");

  setReportMarkdownValue(String(formState.reportMarkdown || ""));

  resetCommentTable();
  state.memo.firstHalf = [];
  state.memo.secondHalf = [];
  state.memo.other = [];

  const savedComments = formState.comments && typeof formState.comments === "object" ? formState.comments : {};
  const keys = Object.keys(savedComments).sort((a, b) => Number(a) - Number(b));
  for (let i = 0; i < keys.length; i++) {
    const row = savedComments[keys[i]];
    if (!row) continue;
    addRow(row.seek, row.sleep, row.comment, row.category || "前半", row.event || "", row.type || "");
  }

  const savedMemo = formState.memo || {};
  if (state.memo.firstHalf.length === 0 && Array.isArray(savedMemo.firstHalf)) {
    savedMemo.firstHalf.forEach((r) => { const s = sanitizeMemoRow(r); if (s) state.memo.firstHalf.push(s); });
  }
  if (state.memo.secondHalf.length === 0 && Array.isArray(savedMemo.secondHalf)) {
    savedMemo.secondHalf.forEach((r) => { const s = sanitizeMemoRow(r); if (s) state.memo.secondHalf.push(s); });
  }
  if (Array.isArray(savedMemo.other)) {
    savedMemo.other.forEach((r) => { const s = sanitizeMemoRow(r); if (s) state.memo.other.push(s); });
  }
  renderMemoTables();

  const shortcutSettings = formState.shortcutSettings && typeof formState.shortcutSettings === "object"
    ? formState.shortcutSettings
    : getDefaultShortcutSettings();
  const mergedShortcutSettings = mergeMissingDefaultShortcutBindings(shortcutSettings);
  applyShortcutSettings(mergedShortcutSettings, "ショートカット設定を復元しました。");
}

function saveCache(showStatus) {
  const payload = {
    version: CACHE_VERSION,
    savedAt: new Date().toISOString(),
    form: collectFormState()
  };
  const serialized = JSON.stringify(payload);
  if (serialized.length > CACHE_MAX_BYTES) {
    if (showStatus) setStatus("キャッシュサイズが大きすぎるため保存できません。", true);
    return false;
  }

  try {
    localStorage.setItem(CACHE_KEY, serialized);
    if (showStatus) setStatus("ブラウザキャッシュに保存しました。");
    return true;
  } catch (_e) {
    if (showStatus) setStatus("キャッシュ保存に失敗しました。", true);
    return false;
  }
}

function restoreCache(showStatus) {
  let serialized;
  try {
    serialized = localStorage.getItem(CACHE_KEY);
  } catch (_e) {
    if (showStatus) setStatus("キャッシュ読み込みに失敗しました。", true);
    return false;
  }
  if (!serialized) {
    if (showStatus) setStatus("復元できるキャッシュがありません。", true);
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(serialized);
  } catch (_e) {
    if (showStatus) setStatus("キャッシュ形式が不正です。", true);
    return false;
  }

  if (!payload || payload.version !== CACHE_VERSION || typeof payload.form !== "object") {
    if (showStatus) setStatus("キャッシュバージョンが一致しません。", true);
    return false;
  }

  applyFormState(payload.form);
  if (showStatus) setStatus("ブラウザキャッシュから復元しました。");
  return true;
}

function clearCache(showStatus) {
  try {
    localStorage.removeItem(CACHE_KEY);
    if (showStatus) setStatus("ブラウザキャッシュを削除しました。");
  } catch (_e) {
    if (showStatus) setStatus("キャッシュ削除に失敗しました。", true);
  }
}

function scheduleCacheSave() {
  if (cacheSaveTimer) clearTimeout(cacheSaveTimer);
  cacheSaveTimer = setTimeout(() => {
    cacheSaveTimer = null;
    saveCache(false);
  }, 300);
}

function onYouTubeIframeAPIReady() {
  const origin = getCurrentOrigin();
  state.player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: normalizeVideoId(getVideoId()),
    playerVars: { origin },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });

  if (!origin) {
    setStatus("file:// で開くと YouTube エラー 153 が出る場合があります。http://localhost などで開いてください。", true);
  }
}

function onPlayerReady() {
  state.playerReady = true;
  if (state.pendingVideoId) {
    const pending = state.pendingVideoId;
    state.pendingVideoId = "";
    loadYouTubeVideo(pending, { autoplay: false });
  }
  setStatus("YouTubeプレーヤーの準備ができました。");
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING && state.sleepTime > 0) {
    clearTimeout(state.videoTimer);
    state.videoTimer = setTimeout(() => {
      if (state.playerReady && state.player) {
        state.player.pauseVideo();
        state.sleepTime = 0;
      }
    }, state.sleepTime * 1000);
  }
}

function onPlayerError(event) {
  if (!event || typeof event.data === "undefined") {
    setStatus("YouTubeプレーヤーエラーが発生しました。", true);
    return;
  }
  if (event.data === 153) {
    setStatus("YouTube エラー 153: プレーヤー設定エラーです。http://localhost で開いてください。", true);
    return;
  }
  setStatus("YouTubeプレーヤーエラー: " + event.data, true);
}

function toggleUsage() {
  const usage = document.getElementById("usage");
  usage.style.display = usage.style.display === "block" ? "none" : "block";
}

function syncSettingsToggleState() {
  if (!section1HeaderToggle) return;
  const expanded = !!(settingsOverlay && settingsOverlay.classList.contains("open"));
  section1HeaderToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
}

function updateSettingsTopOffset() {
  if (!settingsOverlay) return;
  const header = document.querySelector(".page-header");
  let offset = 0;

  if (header) {
    const rect = header.getBoundingClientRect();
    offset = Math.ceil(rect.bottom);
  }

  if (!Number.isFinite(offset) || offset < 0) offset = 0;
  settingsOverlay.style.setProperty("--settings-top-offset", offset + "px");
}

function openSettingsOverlay() {
  if (!settingsOverlay) return;
  updateSettingsTopOffset();
  settingsOverlay.classList.add("open");
  settingsOverlay.setAttribute("aria-hidden", "false");
  syncSettingsToggleState();
}

function closeSettingsOverlay() {
  if (!settingsOverlay) return;
  settingsOverlay.classList.remove("open");
  settingsOverlay.setAttribute("aria-hidden", "true");
  syncSettingsToggleState();
}

function toggleSettingsOverlay() {
  if (!settingsOverlay) return;
  if (settingsOverlay.classList.contains("open")) closeSettingsOverlay();
  else openSettingsOverlay();
}

function updateReportTopOffset() {
  if (!reportOverlay) return;
  const header = document.querySelector(".page-header");
  let offset = 0;

  if (header) {
    const rect = header.getBoundingClientRect();
    offset = Math.ceil(rect.bottom);
  }

  if (!Number.isFinite(offset) || offset < 0) offset = 0;
  reportOverlay.style.setProperty("--report-top-offset", offset + "px");
}

function openReportOverlay() {
  if (!reportOverlay) return;
  updateReportTopOffset();
  reportOverlay.classList.add("open");
  reportOverlay.setAttribute("aria-hidden", "false");
  if (reportToggleTab) reportToggleTab.setAttribute("aria-expanded", "true");
}

function closeReportOverlay() {
  if (!reportOverlay) return;
  reportOverlay.classList.remove("open");
  reportOverlay.setAttribute("aria-hidden", "true");
  if (reportToggleTab) reportToggleTab.setAttribute("aria-expanded", "false");
}

function toggleReportOverlay() {
  if (!reportOverlay) return;
  if (reportOverlay.classList.contains("open")) closeReportOverlay();
  else openReportOverlay();
}

function initializeShortcutSettings() {
  applyShortcutSettings(getDefaultShortcutSettings(), "");
}

if (loadVideoButton) loadVideoButton.addEventListener("click", () => loadYouTubeVideo(getVideoId(), { autoplay: false }));
const usageButton = document.getElementById("usageButton");
if (usageButton) usageButton.addEventListener("click", toggleUsage);
const addCommentButton = document.getElementById("addCommentButton");
if (addCommentButton) addCommentButton.addEventListener("click", () => addRow());
const jsonSaveButton = document.getElementById("jsonSaveButton");
if (jsonSaveButton) jsonSaveButton.addEventListener("click", downloadJSON);

videoIdInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadYouTubeVideo(getVideoId(), { autoplay: false });
});

if (localVideoFileInput) {
  localVideoFileInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    loadLocalVideoFile(file);
    localVideoFileInput.value = "";
  });
}

if (markdownFileInput) {
  markdownFileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const md = await file.text();
      loadReportFromMarkdown(md, { fallbackSource: "local-file:" + file.name });
      setStatus("Markdownを読み込みました: " + file.name);
    } catch (_e) {
      setStatus("Markdownファイルの読み込みに失敗しました。", true);
    }
    markdownFileInput.value = "";
  });
}

if (buildMarkdownButton) {
  buildMarkdownButton.addEventListener("click", () => {
    setReportMarkdownValue(makeReportMarkdown());
    setStatus("Markdownを生成しました。");
    scheduleCacheSave();
  });
}

if (downloadMarkdownButton) {
  downloadMarkdownButton.addEventListener("click", () => {
    const current = getReportMarkdownValue();
    const md = current.trim() ? current : makeReportMarkdown();
  const titleRaw = (document.getElementById("reportTitle").value || "report").trim();
  const safeTitle = titleRaw
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "report";
  const filename = safeTitle + ".md";
  const link = document.createElement("a");
  link.href = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
  link.download = filename;
  link.click();
  setReportMarkdownValue(md);
  setStatus("Markdownを保存しました: " + filename);
  scheduleCacheSave();
  });
}

if (cacheSaveButton) cacheSaveButton.addEventListener("click", () => saveCache(true));
if (cacheLoadButton) cacheLoadButton.addEventListener("click", () => restoreCache(true));
if (cacheClearButton) cacheClearButton.addEventListener("click", () => clearCache(true));
if (section1HeaderToggle) section1HeaderToggle.addEventListener("click", toggleSettingsOverlay);
if (settingsCloseButton) settingsCloseButton.addEventListener("click", closeSettingsOverlay);
if (settingsBackdrop) settingsBackdrop.addEventListener("click", closeSettingsOverlay);
if (reportToggleTab) reportToggleTab.addEventListener("click", toggleReportOverlay);
if (reportCloseButton) reportCloseButton.addEventListener("click", closeReportOverlay);
if (reportBackdrop) reportBackdrop.addEventListener("click", closeReportOverlay);
const filterCategory = document.getElementById("filterCategory");
if (filterCategory) filterCategory.addEventListener("change", applyCommentListTransforms);
const filterType = document.getElementById("filterType");
if (filterType) filterType.addEventListener("change", applyCommentListTransforms);
const filterEvent = document.getElementById("filterEvent");
if (filterEvent) filterEvent.addEventListener("input", applyCommentListTransforms);
const filterComment = document.getElementById("filterComment");
if (filterComment) filterComment.addEventListener("input", applyCommentListTransforms);
const resetFiltersButton = document.getElementById("resetFiltersButton");
if (resetFiltersButton) resetFiltersButton.addEventListener("click", resetFilters);
document.querySelectorAll("input[name='commentCategory']").forEach((el) => {
  el.addEventListener("change", () => {
    updateOtherCategoryTagVisibility();
    scheduleCacheSave();
  });
});
document.querySelectorAll("input[name='commentTeam']").forEach((el) => {
  el.addEventListener("change", scheduleCacheSave);
});
const otherCategoryTag = document.getElementById("otherCategoryTag");
if (otherCategoryTag) otherCategoryTag.addEventListener("input", scheduleCacheSave);
document.querySelectorAll(".comment-label").forEach((el) => {
  el.addEventListener("change", scheduleCacheSave);
});

const commentTypeSelect = document.getElementById("commentType");
if (commentTypeSelect && commentTypeSelect.tagName.toLowerCase() === "select") {
  const collapseCommentTypeSelect = () => {
    const baseSize = Number(commentTypeSelect.dataset.baseSize || 1);
    commentTypeSelect.size = Number.isFinite(baseSize) && baseSize > 0 ? baseSize : 1;
    commentTypeSelect.classList.remove("expanded");
  };
  commentTypeSelect.addEventListener("blur", collapseCommentTypeSelect);
  commentTypeSelect.addEventListener("change", collapseCommentTypeSelect);
}

if (shortcutAddRowButton) {
  shortcutAddRowButton.addEventListener("click", () => {
    appendEmptyShortcutBindingRow();
  });
}

if (shortcutSubmitButton) {
  shortcutSubmitButton.addEventListener("click", () => {
    const candidate = collectShortcutSettingsFromEditor();
    const ok = applyShortcutSettings(candidate, "ショートカット設定を更新しました。");
    if (ok) scheduleCacheSave();
  });
}

if (shortcutResetButton) {
  shortcutResetButton.addEventListener("click", () => {
    const confirmed = window.confirm("ショートカット設定をデフォルトに戻しますか？");
    if (!confirmed) return;
    const ok = applyShortcutSettings(getDefaultShortcutSettings(), "ショートカット設定をデフォルトに戻しました。");
    if (ok) scheduleCacheSave();
  });
}

document.addEventListener("keydown", (event) => {
  handleShortcutKeydown(event);
  if (event.key === "Escape") {
    closeSettingsOverlay();
    closeReportOverlay();
  }
});

window.addEventListener("resize", () => {
  updateSettingsTopOffset();
  updateReportTopOffset();
});

document.addEventListener("input", (event) => {
  const tag = (event.target && event.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") scheduleCacheSave();
});

window.addEventListener("beforeunload", () => {
  saveCache(false);
});

(function initialize() {
  switchVideoMode("youtube");
  resetCommentTable();
  renderMemoTables();
  closeSettingsOverlay();
  closeReportOverlay();
  startTimeSyncTimer();
  updateCurrentVideoTimeField();
  updateOtherCategoryTagVisibility();
  initializeShortcutSettings();
  updateSettingsTopOffset();
  updateReportTopOffset();
  setSelectedCommentText(null);
  applyCommentListTransforms();
  const restored = restoreCache(false);
  if (restored) setStatus("前回の作業内容を復元しました。");
  else setStatus("初期化が完了しました。動画IDまたはURLを入力してください。");

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
})();
