import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dicebox.v1.stats";

const DEFAULT = Object.freeze({
  // Core
  gamesPlayed: 0,
  wins: 0,
  lossCount: 0,
  totalLeftoverSum: 0,

  // Streaks
  currentStreak: 0,
  bestStreak: 0,

  // Records
  bestFewestRolls: null, // lower is better

  // Existing metric you track
  perfectShuts: 0,

  // NEW meta-progression metrics
  totalSkipsUsed: 0,
  totalConfirms: 0,
  total3PlusConfirms: 0,
  total4PlusConfirms: 0,
  most3PlusInGame: 0, // record for a single game
});

export async function getStatsOrDefault() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT, ...parsed };
  } catch {
    return { ...DEFAULT };
  }
}

export async function resetStats() {
  await AsyncStorage.removeItem(KEY);
}

export async function recordGame({
  win,
  perfectShut = false,
  rollsUsed = null,
  leftoverSum = null,

  // NEW optional per-game metrics
  skipsUsed = 0,
  threePlusConfirms = 0,
  fourPlusConfirms = 0,
  maxComboLen = 0,
}) {
  const s = await getStatsOrDefault();

  s.gamesPlayed += 1;

  if (win) {
    s.wins += 1;
    s.currentStreak += 1;
    if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
    if (perfectShut) s.perfectShuts += 1;
    if (typeof rollsUsed === "number" && rollsUsed > 0) {
      if (s.bestFewestRolls == null || rollsUsed < s.bestFewestRolls) {
        s.bestFewestRolls = rollsUsed;
      }
    }
  } else {
    s.lossCount += 1;
    s.currentStreak = 0;
    if (typeof leftoverSum === "number") s.totalLeftoverSum += leftoverSum;
  }

  // Accumulate NEW meta-progression metrics
  if (typeof skipsUsed === "number") s.totalSkipsUsed += Math.max(0, skipsUsed);
  if (typeof threePlusConfirms === "number") s.total3PlusConfirms += Math.max(0, threePlusConfirms);
  if (typeof fourPlusConfirms === "number") s.total4PlusConfirms += Math.max(0, fourPlusConfirms);
  if (typeof maxComboLen === "number") s.most3PlusInGame = Math.max(s.most3PlusInGame, maxComboLen >= 3 ? maxComboLen : s.most3PlusInGame);

  await AsyncStorage.setItem(KEY, JSON.stringify(s));
  return s;
}