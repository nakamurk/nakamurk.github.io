const STORAGE_KEY = "displayRelatedPageLocales";
const DEFAULT_SETTINGS = {
  localeA: "en-us",
  localeB: "ja-jp",
  showPopupOnMatch: false,
  enableDebugLog: true
};

const localeAInput = document.getElementById("localeA");
const localeBInput = document.getElementById("localeB");
const showPopupOnMatchInput = document.getElementById("showPopupOnMatch");
const enableDebugLogInput = document.getElementById("enableDebugLog");
const saveButton = document.getElementById("save");
const status = document.getElementById("status");

restore();
saveButton.addEventListener("click", save);

function restore() {
  chrome.storage.sync.get(STORAGE_KEY, (result) => {
    const saved = result[STORAGE_KEY] || {};
    localeAInput.value = saved.localeA || DEFAULT_SETTINGS.localeA;
    localeBInput.value = saved.localeB || DEFAULT_SETTINGS.localeB;
    showPopupOnMatchInput.checked = typeof saved.showPopupOnMatch === "boolean"
      ? saved.showPopupOnMatch
      : DEFAULT_SETTINGS.showPopupOnMatch;
    enableDebugLogInput.checked = typeof saved.enableDebugLog === "boolean"
      ? saved.enableDebugLog
      : DEFAULT_SETTINGS.enableDebugLog;
  });
}

function save() {
  const localeA = normalizeLocale(localeAInput.value);
  const localeB = normalizeLocale(localeBInput.value);
  const showPopupOnMatch = !!showPopupOnMatchInput.checked;
  const enableDebugLog = !!enableDebugLogInput.checked;

  if (!localeA || !localeB) {
    status.textContent = "Locale は2つとも入力してください。";
    status.style.color = "#8b0000";
    return;
  }

  if (localeA === localeB) {
    status.textContent = "Locale A と Locale B は別の値にしてください。";
    status.style.color = "#8b0000";
    return;
  }

  chrome.storage.sync.set({
    [STORAGE_KEY]: {
      localeA,
      localeB,
      showPopupOnMatch,
      enableDebugLog
    }
  }, () => {
    status.textContent = "保存しました。ページを再読み込みすると反映されます。";
    status.style.color = "#126126";
  });
}

function normalizeLocale(value) {
  return String(value || "").trim().toLowerCase();
}
