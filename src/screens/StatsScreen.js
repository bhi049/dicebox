import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";
import { getStatsOrDefault } from "../storage/stats";

export default function StatsScreen() {
  const t = useTheme();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const s = await getStatsOrDefault();
      setStats(s);
    })();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Text style={styles.title}>Stats</Text>
      {stats ? (
        <>
          <Text>Games Played: {stats.gamesPlayed}</Text>
          <Text>Wins: {stats.wins}</Text>
          <Text>Win %: {stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%</Text>
          <Text>Current Streak: {stats.currentStreak}</Text>
          <Text>Best Streak: {stats.bestStreak}</Text>
          <Text>Perfect Shuts: {stats.perfectShuts}</Text>
          <Text>Best (fewest rolls to win): {stats.bestFewestRolls ?? "-"}</Text>
          <Text>Average Leftover (losses): {stats.avgLeftover?.toFixed?.(2) ?? "-"}</Text>
        </>
      ) : (
        <Text>Loading…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
});
