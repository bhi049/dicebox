import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";

export default function Dice({ d1, d2 }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {[d1, d2].map((d, i) => (
        <View
          key={i}
          style={[
            styles.die,
            { backgroundColor: t.diceBg, borderRadius: t.radius, borderColor: t.border },
          ]}
        >
          <Text style={styles.dieText}>{d ?? "-"}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginVertical: 12 },
  die: { width: 72, height: 72, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  dieText: { fontSize: 28, fontWeight: "800" },
});
