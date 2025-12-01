import type { AllThemeStats, RatingResult } from "./types";

const API_BASE = "https://better-lyrics-themes-api.boidu.dev";

async function getOdid(): Promise<string> {
  const { odid } = await chrome.storage.local.get("odid");
  if (odid) return odid;

  const newOdid = crypto.randomUUID();
  await chrome.storage.local.set({ odid: newOdid });
  return newOdid;
}

export async function fetchAllStats(): Promise<AllThemeStats> {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    if (!response.ok) {
      console.warn("[ThemeStoreAPI] Failed to fetch stats:", response.status);
      return {};
    }
    return response.json();
  } catch (err) {
    console.warn("[ThemeStoreAPI] Failed to fetch stats:", err);
    return {};
  }
}

export async function trackInstall(themeId: string): Promise<number | null> {
  try {
    const response = await fetch(`${API_BASE}/api/install/${themeId}`, {
      method: "POST",
    });

    if (response.status === 429) {
      return null;
    }

    if (!response.ok) {
      console.warn("[ThemeStoreAPI] Failed to track install:", response.status);
      return null;
    }

    const data = await response.json();
    return data.count;
  } catch (err) {
    console.warn("[ThemeStoreAPI] Failed to track install:", err);
    return null;
  }
}

export async function submitRating(themeId: string, rating: number): Promise<RatingResult | null> {
  try {
    const odid = await getOdid();
    const response = await fetch(`${API_BASE}/api/rate/${themeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, odid }),
    });

    if (!response.ok) {
      console.warn("[ThemeStoreAPI] Failed to submit rating:", response.status);
      return null;
    }

    return response.json();
  } catch (err) {
    console.warn("[ThemeStoreAPI] Failed to submit rating:", err);
    return null;
  }
}

export async function fetchRating(themeId: string): Promise<RatingResult> {
  try {
    const response = await fetch(`${API_BASE}/api/rating/${themeId}`);
    if (!response.ok) {
      return { average: 0, count: 0 };
    }
    return response.json();
  } catch {
    return { average: 0, count: 0 };
  }
}
