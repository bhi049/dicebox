import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dicebox.v1.game"; // bump this if schema changes

function serialize(state) {
  const obj = {
    ...state,
    available: Array.from(state.available || []),
    selected: Array.from(state.selected || []),
  };
  return JSON.stringify(obj);
}

function coerce(raw) {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    const okPhase = ["idle", "rolled", "stuck", "gameover", "win"].includes(o.phase);
    if (!okPhase) return null;

    return {
      available: new Set(Array.isArray(o.available) ? o.available : []),
      selected: new Set(Array.isArray(o.selected) ? o.selected : []),
      dice: Array.isArray(o.dice) && o.dice.length === 2 ? o.dice : [null, null],
      phase: o.phase,
      skipsRemaining: Number.isFinite(o.skipsRemaining) ? o.skipsRemaining : 5,
      rollCount: Number.isFinite(o.rollCount) ? o.rollCount : 0,
      diceMode: o.diceMode === 1 ? 1 : 2,
    };
  } catch {
    return null;
  }
}

export async function saveGameState(state) {
  try { await AsyncStorage.setItem(KEY, serialize(state)); } catch {}
}

export async function loadGameState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return coerce(raw);
  } catch {
    return null;
  }
}

export async function clearGameState() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}
