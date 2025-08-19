import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";
import { useCosmetics } from "../cosmetics/CosmeticsContext";
import { TILE_THEMES } from "../cosmetics/palette";

const COLS = 6;
const GAP = 10;

export default function TileGrid({ numbers, availableSet, selectedSet, onToggle, disabled }) {
  const t = useTheme();
  const { equipped } = useCosmetics();
  const skin = TILE_THEMES[equipped?.tileTheme || "default"] || TILE_THEMES.default || {};

  const [gridW, setGridW] = useState(0);
  const tileSize = gridW > 0 ? Math.floor((gridW - GAP * (COLS - 1)) / COLS) : 58;

  return (
    <View
      style={styles.grid}
      onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
    >
      {numbers.map((n, idx) => {
        const available = availableSet.has(n);
        const selected = selectedSet.has(n);

        const bg = available
          ? (skin.openBg ?? t.tile)
          : (skin.closedBg ?? t.tileClosed);

        const baseBorder = available ? "#d1d5db" : (t.border ?? "#e5e7eb");
        const borderColor = skin.border ?? baseBorder;
        const numColor = skin.text ?? "#0f172a";

        const isEndOfRow = (idx % COLS) === COLS - 1;
        const mr = isEndOfRow ? 0 : GAP;
        const mb = idx < numbers.length - COLS ? GAP : 0;

        return (
          <TouchableOpacity
            key={n}
            style={[
              styles.tile,
              {
                width: tileSize,
                height: tileSize,
                marginRight: mr,
                marginBottom: mb,
                borderRadius: t.radius,
                backgroundColor: bg,
                borderColor,
                opacity: available ? 1 : 0.55,
              },
              selected && { borderColor: t.primary, borderWidth: 2 },
            ]}
            onPress={() => onToggle?.(n)}
            disabled={!available || disabled}
            activeOpacity={0.9}
          >
            <Text style={[styles.num, { color: numColor }]}>{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  num: { fontSize: 18, fontWeight: "700" },
});
