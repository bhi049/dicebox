import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";

export default function PrimaryButton({ title, onPress, disabled, style }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: disabled ? "#cbd5e1" : t.primary, borderRadius: t.radius },
        style,
      ]}
      activeOpacity={0.9}
    >
      <Text style={styles.txt}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 18, alignItems: "center" },
  txt: { color: "white", fontWeight: "700", fontSize: 16 },
});
