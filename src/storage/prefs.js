// src/storage/prefs.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dicebox.v1.prefs";

export const DEFAULT_PREFS = {
  haptics: true,
  sounds: false,
  darkMode: false,
};

/** Coerce anything weird into our boolean schema + merge defaults */
function sanitize(raw) {
  const out = { ...DEFAULT_PREFS };
  if (raw && typeof raw === "object") {
    if ("haptics" in raw) out.haptics = !!raw.haptics;
    if ("sounds" in raw) out.sounds = !!raw.sounds;
    if ("darkMode" in raw) out.darkMode = !!raw.darkMode;
  }
  return out;
}

/** Load prefs (always returns a full, valid object). */
export async function loadPrefs() {
  try {
    const str = await AsyncStorage.getItem(KEY);
    if (!str) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(str);
    return sanitize(parsed);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Save prefs (merges with defaults & sanitizes first). */
export async function savePrefs(next) {
  const clean = sanitize(next);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // ignore write errors quietly
  }
  return clean;
}

/** Convenience: set a single key. */
export async function setPref(key, value) {
  const current = await loadPrefs();
  const next = { ...current, [key]: value };
  return savePrefs(next);
}

/** Optional: clear prefs (useful for debugging). */
export async function clearPrefs() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
