const STORAGE_KEY = "displayRelatedPageLocales";
const DEFAULT_SETTINGS = {
  localeA: "en-us",
  localeB: "ja-jp",
  showPopupOnMatch: false,
  enableDebugLog: true
};

if (window.top === window) {
  // Run only in top window to prevent recursive injection in iframes.
  init();
}

function init() {
  chrome.storage.sync.get(STORAGE_KEY, (result) => {
    const saved = result[STORAGE_KEY] || {};
    const settings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      localeA: normalizeLocale(saved.localeA || DEFAULT_SETTINGS.localeA),
      localeB: normalizeLocale(saved.localeB || DEFAULT_SETTINGS.localeB)
    };

    debugLog(settings.enableDebugLog, "Settings loaded", settings);

    const relatedUrl = getRelatedUrl(location.href, settings.localeA, settings.localeB);
    if (!relatedUrl) {
      debugLog(settings.enableDebugLog, "No matching locale in URL", {
        currentUrl: location.href,
        localeA: settings.localeA,
        localeB: settings.localeB
      });
      return;
    }

    debugLog(settings.enableDebugLog, "Related URL generated", {
      currentUrl: location.href,
      relatedUrl
    });

    applySideBySideView(location.href, relatedUrl, settings.enableDebugLog);

    if (settings.showPopupOnMatch) {
      showToast("display_related_page: 関連ページを右側に表示しました。");
    }
  });
}

function normalizeLocale(value) {
  return String(value || "").trim().toLowerCase();
}

function getRelatedUrl(url, localeA, localeB) {
  if (!localeA || !localeB || localeA === localeB) {
    return null;
  }

  if (url.includes(localeA)) {
    return url.replace(localeA, localeB);
  }

  if (url.includes(localeB)) {
    return url.replace(localeB, localeA);
  }

  return null;
}

function applySideBySideView(originalUrl, relatedUrl, enableDebugLog) {
  if (!document.body) {
    return;
  }

  if (document.getElementById("display_related_page_container")) {
    return;
  }

  const existingStyle = document.getElementById("display_related_page_style");
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement("style");
  style.id = "display_related_page_style";
  style.textContent = [
    "html, body {",
    "  margin: 0 !important;",
    "  padding: 0 !important;",
    "  width: 100% !important;",
    "  height: 100vh;",
    "  overflow: hidden !important;",
    "}",
    "#display_related_page_container {",
    "  position: fixed;",
    "  inset: 0;",
    "  display: flex;",
    "  flex-direction: row;",
    "  background: #fff;",
    "  z-index: 2147483647;",
    "}",
    "#display_related_page_left,",
    "#display_related_page_right {",
    "  width: 50vw;",
    "  min-width: 50vw;",
    "  height: 100vh;",
    "  border: 0;",
    "  box-sizing: border-box;",
    "}",
    "#display_related_page_left { border-right: 1px solid #d0d0d0; }",
    "@media (max-width: 900px) {",
    "  #display_related_page_container { flex-direction: column; }",
    "  #display_related_page_left,",
    "  #display_related_page_right {",
    "    width: 100vw;",
    "    min-width: 100vw;",
    "    height: 50vh;",
    "  }",
    "}"
  ].join("\n");
  document.documentElement.appendChild(style);

  const container = document.createElement("div");
  container.id = "display_related_page_container";

  const leftIframe = document.createElement("iframe");
  leftIframe.id = "display_related_page_left";
  leftIframe.src = originalUrl;
  leftIframe.title = "Current page";

  const rightIframe = document.createElement("iframe");
  rightIframe.id = "display_related_page_right";
  rightIframe.src = relatedUrl;
  rightIframe.title = "Related locale page";

  container.appendChild(leftIframe);
  container.appendChild(rightIframe);
  document.body.appendChild(container);

  setupScrollSync(leftIframe, rightIframe, enableDebugLog);
}

function setupScrollSync(leftIframe, rightIframe, enableDebugLog) {
  let isSyncing = false;

  function bind(sourceWin, targetWin, sourceName) {
    sourceWin.addEventListener("scroll", () => {
      if (isSyncing) {
        return;
      }

      isSyncing = true;
      const scrollX = sourceWin.scrollX || sourceWin.pageXOffset || 0;
      const scrollY = sourceWin.scrollY || sourceWin.pageYOffset || 0;

      try {
        targetWin.scrollTo(scrollX, scrollY);
      } catch (error) {
        debugLog(enableDebugLog, "Scroll sync failed", { sourceName, error });
      }

      isSyncing = false;
    }, { passive: true });
  }

  function tryBind() {
    const leftWin = leftIframe.contentWindow;
    const rightWin = rightIframe.contentWindow;

    if (!leftWin || !rightWin) {
      return;
    }

    bind(leftWin, rightWin, "left");
    bind(rightWin, leftWin, "right");
    debugLog(enableDebugLog, "Scroll sync enabled");
  }

  leftIframe.addEventListener("load", tryBind);
  rightIframe.addEventListener("load", tryBind);
}

function showToast(message) {
  const existingToast = document.getElementById("display_related_page_toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.id = "display_related_page_toast";
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "14px";
  toast.style.left = "14px";
  toast.style.zIndex = "2147483647";
  toast.style.background = "#111";
  toast.style.color = "#fff";
  toast.style.padding = "10px 12px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "13px";
  toast.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.25)";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function debugLog(enabled, message, data) {
  if (!enabled) {
    return;
  }

  if (typeof data === "undefined") {
    console.log("[display_related_page]", message);
    return;
  }

  console.log("[display_related_page]", message, data);
}

