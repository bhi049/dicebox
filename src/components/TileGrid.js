import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";

export default function TileGrid({ numbers, availableSet, selectedSet, onToggle, disabled }) {
  const t = useTheme();

  return (
    <View style={styles.grid}>
      {numbers.map((n) => {
        const available = availableSet.has(n);
        const selected = selectedSet.has(n);
        return (
          <TouchableOpacity
            key={n}
            style={[
              styles.tile,
              {
                borderRadius: t.radius,
                backgroundColor: available ? t.tile : t.tileClosed,
                borderColor: available ? "#d1d5db" : t.border,
                opacity: available ? 1 : 0.55,
              },
              selected && { borderColor: t.primary, borderWidth: 2 },
            ]}
            onPress={() => onToggle?.(n)}
            disabled={!available || disabled}
            activeOpacity={0.9}
          >
            <Text style={styles.num}>{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  tile: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  num: { fontSize: 18, fontWeight: "700" },
});
