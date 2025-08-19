import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dicebox.v1.progression";

const DEFAULT = Object.freeze({
  achievements: {}, // { [id]: { unlocked: true, date: ISO } }
  cosmetics: {
    inventory: {
      diceSkin: {},   // { [cosmeticId]: true }
      tileTheme: {},
      confetti: {},
      theme: {},
    },
    equipped: {
      diceSkin: null,
      tileTheme: null,
      confetti: null,
      theme: null,
    },
  },
});

export async function loadProgression() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, cosmetics: { ...DEFAULT.cosmetics, inventory: { ...DEFAULT.cosmetics.inventory }, equipped: { ...DEFAULT.cosmetics.equipped } } };
    const parsed = JSON.parse(raw);
    const safe = { ...DEFAULT, ...parsed };
    // Ensure shapes exist
    safe.achievements = safe.achievements || {};
    safe.cosmetics = safe.cosmetics || { ...DEFAULT.cosmetics };
    safe.cosmetics.inventory = { ...DEFAULT.cosmetics.inventory, ...(safe.cosmetics.inventory || {}) };
    safe.cosmetics.equipped = { ...DEFAULT.cosmetics.equipped, ...(safe.cosmetics.equipped || {}) };
    return safe;
  } catch {
    return { ...DEFAULT, cosmetics: { ...DEFAULT.cosmetics, inventory: { ...DEFAULT.cosmetics.inventory }, equipped: { ...DEFAULT.cosmetics.equipped } } };
  }
}

export async function saveProgression(p) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export async function awardAchievements(ids = []) {
  if (!ids.length) return null;
  const prog = await loadProgression();
  const now = new Date().toISOString();
  prog.achievements = { ...prog.achievements };
  ids.forEach(id => {
    prog.achievements[id] = { unlocked: true, date: now };
  });
  await saveProgression(prog);
  return prog;
}

// items: [{ type: "diceSkin"|"tileTheme"|"confetti"|"theme", id: "..." }, ...]
export async function unlockCosmetics(items = []) {
  if (!items.length) return null;
  const prog = await loadProgression();
  const inv = prog.cosmetics.inventory;
  items.forEach(({ type, id }) => {
    if (inv[type]) inv[type][id] = true;
  });
  await saveProgression(prog);
  return prog;
}

export async function equipCosmetic(type, idOrNull) {
  const prog = await loadProgression();
  if (!prog.cosmetics.equipped.hasOwnProperty(type)) return prog;
  // Only allow equipping items the user owns (or clearing with null)
  if (idOrNull && !prog.cosmetics.inventory[type]?.[idOrNull]) return prog;
  prog.cosmetics.equipped[type] = idOrNull ?? null;
  await saveProgression(prog);
  return prog;
}

export async function clearProgression() {
  await AsyncStorage.removeItem(KEY);
}