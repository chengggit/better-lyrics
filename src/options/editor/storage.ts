import type { SaveResult } from "./types";
import { SYNC_STORAGE_LIMIT, MAX_RETRY_ATTEMPTS } from "./config";
import { syncIndicator } from "./dom";

export const getStorageStrategy = (css: string): "local" | "sync" => {
  const cssSize = new Blob([css]).size;
  return cssSize > SYNC_STORAGE_LIMIT ? "local" : "sync";
};

export const saveToStorageWithFallback = async (css: string, isTheme = false, retryCount = 0): Promise<SaveResult> => {
  try {
    const strategy = getStorageStrategy(css);

    if (strategy === "local") {
      await chrome.storage.local.set({ customCSS: css });
      await chrome.storage.sync.remove("customCSS");
      await chrome.storage.sync.set({ cssStorageType: "local" });
    } else {
      await chrome.storage.sync.set({ customCSS: css, cssStorageType: "sync" });
      await chrome.storage.local.remove("customCSS");
    }

    return { success: true, strategy };
  } catch (error: any) {
    console.error("Storage save attempt failed:", error);

    if (error.message?.includes("quota") && retryCount < MAX_RETRY_ATTEMPTS) {
      try {
        await chrome.storage.local.set({ customCSS: css });
        await chrome.storage.sync.remove("customCSS");
        await chrome.storage.sync.set({ cssStorageType: "local" });
        return { success: true, strategy: "local", wasRetry: true };
      } catch (localError) {
        console.error("Local storage fallback failed:", localError);
        return { success: false, error: localError };
      }
    }

    return { success: false, error };
  }
};

export async function loadCustomCSS(): Promise<string> {
  let css: string | null = null;
  try {
    const syncData = await chrome.storage.sync.get(["cssStorageType", "customCSS"]);

    if (syncData.cssStorageType === "local") {
      const localData = await chrome.storage.local.get("customCSS");
      css = localData.customCSS;
    } else {
      css = syncData.customCSS;
    }
  } catch (error) {
    console.error("Error loading CSS:", error);
    try {
      const localData = await chrome.storage.local.get("customCSS");
      if (localData.customCSS) {
        css = localData.customCSS;
      }

      const syncData = await chrome.storage.sync.get("customCSS");
      css = syncData.customCSS;
    } catch (fallbackError) {
      console.error("Fallback loading failed:", fallbackError);
    }
  }
  return css || "";
}

export function showSyncSuccess(strategy: "local" | "sync", wasRetry?: boolean): void {
  syncIndicator.innerText =
    strategy === "local" ? (wasRetry ? "Saved (Large CSS - Local)" : "Saved (Local)") : "Saved!";
  syncIndicator.classList.add("success");

  setTimeout(() => {
    syncIndicator.style.display = "none";
    syncIndicator.innerText = "Saving...";
    syncIndicator.classList.remove("success");
  }, 1000);
}

export function showSyncError(error: any): void {
  let errorMessage = "Something went wrong!";
  if (error.message?.includes("quota")) {
    errorMessage = "CSS too large for storage!";
  }

  syncIndicator.innerText = errorMessage;
  syncIndicator.classList.add("error");
  setTimeout(() => {
    syncIndicator.style.display = "none";
    syncIndicator.innerText = "Saving...";
    syncIndicator.classList.remove("error");
  }, 3000);
}

export async function sendUpdateMessage(css: string, strategy: "local" | "sync"): Promise<void> {
  try {
    chrome.runtime
      .sendMessage({
        action: "updateCSS",
        css: css,
        storageType: strategy,
      })
      .catch(error => {
        console.log("[BetterLyrics] (Safe to ignore) Error sending message:", error);
      });
  } catch (err) {
    console.log(err);
  }
}
