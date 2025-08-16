import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { useTheme } from "../theme/theme";

export default function HomeScreen({ navigation }) {
  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Text style={styles.title}>DiceBox</Text>
      <Text style={styles.subtitle}>Clear all numbers 1–12. Minimal & chill.</Text>

      <PrimaryButton title="Start Game" onPress={() => navigation.navigate("Game")} style={{ width: 200, marginTop: 24 }} />
      <PrimaryButton title="Stats" onPress={() => navigation.navigate("Stats")} style={{ width: 200, marginTop: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { marginTop: 8, color: "#475569" },
});
