import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useTheme } from "../theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { haptic } from "../utils/haptics";

import { ACHIEVEMENTS } from "../logic/achievements";
import { loadProgression, clearProgression, onProgressionChange } from "../storage/progression";
import { getStatsOrDefault } from "../storage/stats";

// ✅ cosmetics context (instant equip)
import { useCosmetics } from "../cosmetics/CosmeticsContext";

const COSMETIC_SECTIONS = [
  { type: "diceSkin", title: "Dice", icon: "🎲" },
  { type: "tileTheme", title: "Tiles", icon: "🔷" },
  { type: "confetti", title: "Confetti", icon: "🎉" },
  { type: "theme", title: "Theme", icon: "🎨" },
];

function SectionTitle({ children }) { return <Text style={styles.sectionTitle}>{children}</Text>; }
function Row({ children, dim }) { return <View style={[styles.row, dim && { opacity: 0.55 }]}>{children}</View>; }
function LockIcon({ color = "#334155" }) { return <Ionicons name="lock-closed-outline" size={16} color={color} />; }
function TrophyIcon() { return <Ionicons name="trophy" size={16} color="#16a34a" />; }

function ProgressMini({ cur = 0, goal = 1 }) {
  const pct = Math.max(0, Math.min(100, Math.round((goal ? (cur / goal) : 0) * 100)));
  return (
    <View style={styles.progressMini}>
      <View style={styles.progressTrackMini}>
        <View style={[styles.progressFillMini, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressTextMini}>
        {Math.min(cur, goal)}/{goal}
      </Text>
    </View>
  );
}

const REWARD_ICON = {
  diceSkin: "🎲",
  tileTheme: "🔷",
  confetti: "🎉",
  theme: "🎨",
};

const pretty = (id) => id.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Map an achievement id to a measurable progress spec using stats. */
function progressFor(id, stats) {
  switch (id) {
    case "first_win":           return { cur: stats?.wins ?? 0, goal: 1, label: "Wins" };
    case "perfect_shut":        return { cur: stats?.perfectShuts ?? 0, goal: 1, label: "Perfect Wins" };
    case "tight_loss":          return { cur: 0, goal: 1, label: "Tight Losses" }; // event based
    case "streak_3":            return { cur: Math.min(stats?.bestStreak ?? 0, 3), goal: 3, label: "Best Win Streak" };
    case "wins_10":             return { cur: Math.min(stats?.wins ?? 0, 10), goal: 10, label: "Total Wins" };
    case "combo_3_master":      return { cur: Math.min(stats?.total3PlusConfirms ?? 0, 10), goal: 10, label: "3+ Tile Confirms" };
    case "combo_4_master":      return { cur: Math.min(stats?.total4PlusConfirms ?? 0, 5), goal: 5, label: "4+ Tile Confirms" };
    case "speed_runner":        return { cur: 0, goal: 1, label: "Fast Wins" }; // event based
    default:                    return { cur: 0, goal: 1, label: "" };
  }
}

/** Render a compact reward line like: “Unlocks: 🎲 Gold · 🎉 Sparkles” */
function RewardsLine({ rewards }) {
  if (!rewards || rewards.length === 0) return null;
  return (
    <View style={styles.rewardsLine}>
      <Text style={styles.rewardsLabel}>Unlocks:</Text>
      <View style={styles.rewardsChips}>
        {rewards.map((r, i) => (
          <View key={`${r.type}:${r.id}:${i}`} style={styles.rewardChip}>
            <Text style={styles.rewardChipTxt}>
              {REWARD_ICON[r.type] ?? "🎁"} {pretty(r.id)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AchievementsScreen({ navigation }) {
  const t = useTheme();
  const { inventory, equipped, equip, refresh: refreshCosmetics } = useCosmetics();

  const [achievementsState, setAchievementsState] = useState({});
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    const p = await loadProgression();
    const s = await getStatsOrDefault();
    setAchievementsState(p.achievements || {});
    setStats(s);
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Instant updates when achievements/cosmetics change anywhere
  useEffect(() => onProgressionChange(() => { load(); refreshCosmetics(); }), [load, refreshCosmetics]);

  const isUnlocked = useCallback((id) => !!achievementsState?.[id]?.unlocked, [achievementsState]);

  const unlocked = useMemo(() => ACHIEVEMENTS.filter((a) => isUnlocked(a.id)), [isUnlocked]);
  const locked   = useMemo(() => ACHIEVEMENTS.filter((a) => !isUnlocked(a.id)), [isUnlocked]);

  const onEquip   = async (type, id)   => { await equip(type, id);   haptic("select"); };
  const onUnequip = async (type)       => { await equip(type, null); haptic("select"); };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Unlocked */}
        <View style={styles.card}>
          <SectionTitle>Unlocked</SectionTitle>
          {unlocked.length === 0 ? (
            <Text style={styles.empty}>None yet — go play a round!</Text>
          ) : (
            unlocked.map((a) => (
              <View key={a.id} style={{ paddingVertical: 6 }}>
                <Row>
                  <TrophyIcon />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{a.title}</Text>
                    <Text style={styles.rowDesc}>{a.description}</Text>
                    <RewardsLine rewards={a.rewards} />
                  </View>
                  <Text style={styles.emoji}>{a.icon}</Text>
                </Row>
              </View>
            ))
          )}
        </View>

        {/* Locked */}
        <View style={styles.card}>
          <SectionTitle>Locked</SectionTitle>
          {locked.length === 0 ? (
            <Text style={styles.empty}>You’ve unlocked everything (for now)!</Text>
          ) : (
            locked.map((a) => {
              const p = progressFor(a.id, stats || {});
              const showProgress = p && p.goal > 0;
              return (
                <View key={a.id} style={{ paddingVertical: 6 }}>
                  <Row dim>
                    <LockIcon />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{a.title}</Text>
                      <Text style={styles.rowDesc}>{a.description}</Text>
                      <RewardsLine rewards={a.rewards} />
                      {showProgress && (
                        <View style={styles.miniRow}>
                          <Text style={styles.progressMiniLabel}>{p.label}</Text>
                          <ProgressMini cur={p.cur} goal={p.goal} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.emoji}>{a.icon}</Text>
                  </Row>
                </View>
              );
            })
          )}
        </View>

        {/* Owned Cosmetics (live) */}
        <View style={styles.card}>
          <SectionTitle>Owned Cosmetics</SectionTitle>
          {COSMETIC_SECTIONS.map(({ type, title, icon }) => {
            const ownedIds = Object.keys(inventory?.[type] || {});
            const equippedId = equipped?.[type] ?? null;

            return (
              <View key={type} style={{ marginBottom: 10 }}>
                <Text style={styles.cosSectionTitle}>{icon} {title}</Text>

                {ownedIds.length === 0 ? (
                  <Text style={styles.emptySmall}>
                    None yet — unlock some by earning achievements.
                  </Text>
                ) : (
                  <View style={styles.chipsRow}>
                    <TouchableOpacity
                      onPress={() => onUnequip(type)}
                      style={[styles.chip, !equippedId && styles.chipActive]}
                    >
                      <Text style={!equippedId ? styles.chipActiveTxt : styles.chipTxt}>
                        None
                      </Text>
                    </TouchableOpacity>

                    {ownedIds.map((id) => {
                      const active = equippedId === id;
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() => onEquip(type, id)}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text style={active ? styles.chipActiveTxt : styles.chipTxt}>
                            {pretty(id)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Manage */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.cardTitle}>Manage</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() =>
              Alert.alert(
                "Reset progression?",
                "Clears achievements and cosmetics.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                      await clearProgression();
                      await load();
                      await refreshCosmetics();
                    },
                  },
                ]
              )
            }
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.resetTxt}>Reset Progression</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backTxt: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800" },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dangerCard: { borderColor: "#fee2e2", backgroundColor: "#fff" },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 8 },

  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  rowTitle: { fontWeight: "700", color: "#0f172a" },
  rowDesc: { color: "#475569" },
  emoji: { fontSize: 16 },

  // Rewards line
  rewardsLine: { marginTop: 6, flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  rewardsLabel: { color: "#64748b", marginRight: 6 },
  rewardsChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  rewardChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rewardChipTxt: { color: "#334155", fontWeight: "600", fontSize: 12 },

  // Progress mini
  miniRow: { marginTop: 8 },
  progressMiniLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  progressMini: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressTrackMini: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFillMini: { height: "100%", borderRadius: 999, backgroundColor: "#4f46e5" },
  progressTextMini: { width: 56, textAlign: "right", color: "#334155", fontSize: 12 },

  // Cosmetics inventory section
  cosSectionTitle: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipTxt: { color: "#0f172a", fontWeight: "600" },
  chipActiveTxt: { color: "white", fontWeight: "700" },

  empty: { color: "#64748b" },
  emptySmall: { color: "#94a3b8", paddingVertical: 2 },

  cardTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 8 },
  resetBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    justifyContent: "center",
  },
  resetTxt: { color: "#ef4444", fontWeight: "700" },
});
