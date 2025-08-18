import React, { useMemo, useRef, useEffect } from "react";
import { Pressable, View, Text, StyleSheet, Animated } from "react-native";

const TRACK_W = 54;
const TRACK_H = 32;
const PADDING = 3;
const KNOB = TRACK_H - PADDING * 2; // 26

export default function ToggleSwitch({ label, value, onChange, disabled }) {
  // Separate animated values so we don't mix drivers.
  const pos = useRef(new Animated.Value(value ? 1 : 0)).current;   // native (translate/opacity)
  const tint = useRef(new Animated.Value(value ? 1 : 0)).current;  // JS (colors)
  const scale = useRef(new Animated.Value(1)).current;             // native (spring)

  useEffect(() => {
    const to = value ? 1 : 0;

    Animated.parallel([
      // Native driver for movement/opacity
      Animated.timing(pos, { toValue: to, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: value ? 1.03 : 1, friction: 6, tension: 140, useNativeDriver: true }),
      // JS driver for colors (background/border don't support native)
      Animated.timing(tint, { toValue: to, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [value, pos, tint, scale]);

  // Interpolations
  const translateX = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, TRACK_W - KNOB - PADDING], // 3 -> 25
  });

  const haloOpacity = pos.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  const trackBg = tint.interpolate({ inputRange: [0, 1], outputRange: ["#e5e7eb", "#4f46e5"] });
  const trackBorder = tint.interpolate({ inputRange: [0, 1], outputRange: ["#d1d5db", "#4338ca"] });

  const content = useMemo(
    () => (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>

        <Animated.View
          style={[
            styles.track,
            {
              backgroundColor: trackBg,
              borderColor: trackBorder,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          {/* soft glow when ON */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                opacity: haloOpacity,
                transform: [{ translateX }, { scale }],
              },
            ]}
          />

          {/* knob */}
          <Animated.View
            style={[
              styles.knob,
              {
                transform: [{ translateX }, { scale }],
              },
            ]}
          />
        </Animated.View>
      </View>
    ),
    [label, disabled, trackBg, trackBorder, translateX, haloOpacity, scale]
  );

  return (
    <Pressable
      onPress={() => !disabled && onChange?.(!value)}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: 999,
    borderWidth: 1,
    padding: PADDING,
    justifyContent: "center",
  },
  knob: {
    position: "absolute",
    width: KNOB,
    height: KNOB,
    borderRadius: 999,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  halo: {
    position: "absolute",
    width: KNOB,
    height: KNOB,
    borderRadius: 999,
    backgroundColor: "#4f46e5",
  },
});