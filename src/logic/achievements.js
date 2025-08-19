// src/logic/achievements.js

// Each achievement may optionally grant cosmetic rewards.
export const ACHIEVEMENTS = [
  // — Early retention / first-session goals
  {
    id: "first_win",
    title: "First Win",
    description: "Win one game.",
    icon: "🏆",
    rule: ({ result }) => !!result.win,
    rewards: [{ type: "diceSkin", id: "gold" }],
  },
  {
    id: "perfect_shut",
    title: "Perfect Shut",
    description: "Win without using any skips.",
    icon: "✨",
    rule: ({ result }) => !!result.win && !!result.perfectShut,
    rewards: [{ type: "confetti", id: "sparkles" }],
  },
  {
    id: "tight_loss",
    title: "Tight Loss",
    description: "Lose with leftover ≤ 6.",
    icon: "🎯",
    rule: ({ result }) => !result.win && typeof result.leftoverSum === "number" && result.leftoverSum <= 6,
    rewards: [{ type: "tileTheme", id: "slate" }],
  },

  // — Short/medium-term progression
  {
    id: "streak_3",
    title: "On a Roll",
    description: "Reach a 3-win streak.",
    icon: "🔥",
    rule: ({ stats }) => (stats?.currentStreak ?? 0) >= 3,
    rewards: [{ type: "theme", id: "midnight" }],
  },
  {
    id: "wins_10",
    title: "Tenacious",
    description: "Win 10 games total.",
    icon: "💪",
    rule: ({ stats }) => (stats?.wins ?? 0) >= 10,
    rewards: [{ type: "diceSkin", id: "neon" }],
  },

  // — Skill expression (promotes interesting turns)
  {
    id: "combo_3_master",
    title: "Combo Master",
    description: "Make 10 confirms using 3+ tiles (lifetime).",
    icon: "🔗",
    rule: ({ stats }) => (stats?.total3PlusConfirms ?? 0) >= 10,
    rewards: [{ type: "confetti", id: "fireworks" }],
  },
  {
    id: "combo_4_master",
    title: "Big Brain",
    description: "Make 5 confirms using 4+ tiles (lifetime).",
    icon: "🧠",
    rule: ({ stats }) => (stats?.total4PlusConfirms ?? 0) >= 5,
    rewards: [{ type: "tileTheme", id: "glass" }],
  },

  // — Efficiency challenge
  {
    id: "speed_runner",
    title: "Speed Runner",
    description: "Win in 7 rolls or fewer.",
    icon: "⚡",
    rule: ({ result }) => !!result.win && (result.rollsUsed ?? 999) <= 7,
    rewards: [{ type: "diceSkin", id: "carbon" }],
  },
];

// Returns the *IDs* of newly unlocked achievements (not already owned)
export function evaluateAchievements({ result, stats }, achievedSet = new Set()) {
  return ACHIEVEMENTS
    .filter(a => a.rule({ result, stats }) && !achievedSet.has(a.id))
    .map(a => a.id);
}

export function getAchievementMeta(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}

// Map newly unlocked achievement IDs -> flattened cosmetics reward items
export function rewardsFor(ids = []) {
  return ids.flatMap(id => (getAchievementMeta(id)?.rewards ?? []));
}
