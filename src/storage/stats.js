import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dicebox.stats.v1";

export function defaultStats() {
  return {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    perfectShuts: 0,
    bestFewestRolls: null, // lower is better
    totalLeftoverSum: 0,   // to compute average on losses
    lossCount: 0,
  };
}

export async function getStatsOrDefault() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw);
    return { ...defaultStats(), ...parsed };
  } catch {
    return defaultStats();
  }
}

async function save(stats) {
  await AsyncStorage.setItem(KEY, JSON.stringify(stats));
}

export async function recordGame({ win, perfectShut = false, rollsUsed = null, leftoverSum = null }) {
  const s = await getStatsOrDefault();
  s.gamesPlayed += 1;

  if (win) {
    s.wins += 1;
    s.currentStreak += 1;
    if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
    if (perfectShut) s.perfectShuts += 1;
    if (typeof rollsUsed === "number") {
      if (s.bestFewestRolls == null || rollsUsed < s.bestFewestRolls) {
        s.bestFewestRolls = rollsUsed;
      }
    }
  } else {
    s.currentStreak = 0;
    if (typeof leftoverSum === "number") {
      s.totalLeftoverSum += leftoverSum;
      s.lossCount += 1;
    }
  }
  await save(s);
  return s;
}

export async function resetStats() {
  await AsyncStorage.removeItem(KEY);
}
