// src/screens/StatsScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useTheme } from "../theme/theme";
import { getStatsOrDefault, resetStats } from "../storage/stats";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { haptic } from "../utils/haptics";

function Pill({ label, value }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function ProgressRow({ label, percent }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent || 0)));
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressPct}>{pct}%</Text>
    </View>
  );
}

export default function StatsScreen({ navigation }) {
  const t = useTheme();
  const [stats, setStats] = useState(null);

  async function load() {
    const s = await getStatsOrDefault();
    setStats(s);
  }

  useEffect(() => {
    load();
  }, []);

  // Auto-refresh when returning from a game
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const winRate = stats?.gamesPlayed ? (stats.wins / stats.gamesPlayed) * 100 : 0;
  const perfectPct = stats?.gamesPlayed ? (stats.perfectShuts / stats.gamesPlayed) * 100 : 0;
  const avgLeftover = stats?.lossCount ? stats.totalLeftoverSum / stats.lossCount : null;

  const SIDE_W = 88; // keep left & right widths equal so title is centered

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      {/* Header — matches Settings back button + centered title */}
      <View style={styles.headerRow}>
        <View style={{ width: SIDE_W, alignItems: "flex-start" }}>
          <TouchableOpacity
            onPress={() => { haptic("select"); navigation.goBack(); }}
            activeOpacity={0.85}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Stats</Text>

        <View style={{ width: SIDE_W, alignItems: "flex-end" }}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { haptic("select"); load(); }}
            accessibilityLabel="Refresh stats"
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* KPI Pills */}
        <View style={styles.card}>
          <View style={styles.pillsRow}>
            <Pill label="Games" value={stats?.gamesPlayed ?? 0} />
            <Pill label="Wins" value={stats?.wins ?? 0} />
            <Pill label="Win Streak" value={stats?.currentStreak ?? 0} />
            <Pill label="Best Streak" value={stats?.bestStreak ?? 0} />
          </View>
        </View>

        {/* Progress Bars */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <ProgressRow label="Win Rate" percent={winRate} />
          <ProgressRow label="Perfect Shuts" percent={perfectPct} />
        </View>

        {/* Records */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Records</Text>
          <View style={styles.statRow}>
            <Ionicons name="trophy-outline" size={18} color="#334155" />
            <Text style={styles.statKey}>Fewest Rolls (Win)</Text>
            <Text style={styles.statVal}>{stats?.bestFewestRolls ?? "-"}</Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="calculator-outline" size={18} color="#334155" />
            <Text style={styles.statKey}>Avg Leftover (Losses)</Text>
            <Text style={styles.statVal}>
              {avgLeftover != null ? avgLeftover.toFixed(2) : "-"}
            </Text>
          </View>
        </View>

        {/* Reset */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.cardTitle}>Manage</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() =>
              Alert.alert(
                "Reset stats?",
                "This will clear your games, streaks and records.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                      await resetStats();
                      await load();
                    },
                  },
                ]
              )
            }
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.resetTxt}>Reset All Stats</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  headerRow: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  backTxt: { fontSize: 16, fontWeight: "700", color: "#334155" },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },

  refreshBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },

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

  cardTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 8 },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  pill: {
    flexGrow: 1,
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    alignItems: "center",
  },
  pillLabel: { fontSize: 12, color: "#64748b" },
  pillValue: { fontSize: 18, fontWeight: "800", color: "#0f172a" },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 6,
  },
  progressLabel: { width: 110, textAlign: "right", color: "#334155" },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4f46e5",
  },
  progressPct: { width: 44, textAlign: "left", color: "#334155" },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  statKey: { flex: 1, color: "#334155" },
  statVal: { fontWeight: "800", color: "#0f172a" },

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
