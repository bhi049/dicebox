import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useTheme } from "../theme/theme";
import PrimaryButton from "./PrimaryButton";

function StatPill({ label, value }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

// simple bar (0–100)
function Bar({ label, pct }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${clamped}%` }]} />
      </View>
      <Text style={styles.barPct}>{clamped}%</Text>
    </View>
  );
}

export default function ResultModal({
  visible,
  type,               // 'win' | 'loss'
  rollsUsed,          // number
  leftoverSum,        // number | null
  stats,              // latest stats object
  onPlayAgain,
  onClose,            // (optional) close to home
}) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const winRate = stats?.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const avgLeft = stats?.lossCount ? (stats.totalLeftoverSum / stats.lossCount) : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>

        <Animated.View
          style={[
            styles.card,
            { backgroundColor: t.card, borderRadius: t.radius, transform: [{ scale }], opacity },
          ]}
        >
          <Text style={styles.resultEmoji}>{type === "win" ? "🎉" : "🎲"}</Text>
          <Text style={styles.title}>{type === "win" ? "Perfect Shut!" : "Game Over"}</Text>
          <Text style={styles.subtitle}>
            {type === "win" ? `You cleared all numbers in ${rollsUsed} roll${rollsUsed === 1 ? "" : "s"}.`
                            : `No moves left. Leftover total: ${leftoverSum}`}
          </Text>

          {/* Quick stat pills */}
          <View style={styles.pillsRow}>
            <StatPill label="Games" value={stats?.gamesPlayed ?? 0} />
            <StatPill label="Wins" value={stats?.wins ?? 0} />
            <StatPill label="Streak" value={stats?.currentStreak ?? 0} />
            <StatPill label="Best" value={stats?.bestStreak ?? 0} />
          </View>

          {/* Bars (satisfying visual) */}
          <View style={styles.bars}>
            <Bar label="Win Rate" pct={winRate} />
            <Bar label="Perfect Shuts" pct={stats?.gamesPlayed ? Math.round((stats.perfectShuts / stats.gamesPlayed) * 100) : 0} />
          </View>

          {/* Footnote numbers */}
          <View style={styles.footRow}>
            <Text style={styles.footText}>
              Fewest Rolls (Win): {stats?.bestFewestRolls ?? "-"}
            </Text>
            <Text style={styles.footText}>
              Avg Leftover (Loss): {avgLeft != null ? avgLeft.toFixed(1) : "-"}
            </Text>
          </View>

          {/* Actions */}
          <PrimaryButton title="Play Again" onPress={onPlayAgain} style={{ width: 220, marginTop: 14 }} />
          <TouchableOpacity onPress={onClose} style={{ paddingVertical: 10 }}>
            <Text style={styles.secondary}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center", justifyContent: "center", padding: 20,
  },
  card: { width: "100%", maxWidth: 420, padding: 18, alignItems: "center" },
  resultEmoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { marginTop: 4, color: "#475569", textAlign: "center" },

  pillsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 },
  pill: {
    minWidth: 74, paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 999, backgroundColor: "#eef2ff", alignItems: "center",
  },
  pillLabel: { fontSize: 12, color: "#64748b" },
  pillValue: { fontSize: 16, fontWeight: "800" },

  bars: { width: "100%", marginTop: 16, gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 110, textAlign: "right", color: "#334155" },
  barTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: "#e2e8f0", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999, backgroundColor: "#4f46e5" },
  barPct: { width: 44, textAlign: "left", color: "#334155" },

  footRow: { width: "100%", marginTop: 10, gap: 2 },
  footText: { textAlign: "center", color: "#475569" },

  secondary: { color: "#334155", fontWeight: "700" },
});
