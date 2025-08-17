// src/components/Dice.js
import React, { useEffect, useRef, useState, memo } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "../theme/theme";

const ROLL_MS = 500;     // spin+bounce duration
const STAGGER_MS = 120;  // small delay for die #2

const Die = memo(function Die({ value, trigger, delayMs = 0 }) {
  const t = useTheme();
  const rot = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // All on the native driver (smooth even if JS stalls)
    rot.setValue(0);
    lift.setValue(0);

    const anim = Animated.sequence([
      Animated.delay(delayMs),
      Animated.parallel([
        Animated.timing(rot,  { toValue: 1, duration: ROLL_MS, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 1, duration: ROLL_MS, useNativeDriver: true }),
      ]),
      Animated.spring(lift, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]);

    anim.start();
    return () => anim.stop();
  }, [trigger, delayMs, rot, lift]);

  const rotateZ   = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const translateY= lift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const scale     = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Animated.View
      style={[
        styles.die,
        {
          backgroundColor: t.diceBg,
          borderRadius: t.radius,
          borderColor: t.border,
          transform: [{ rotateZ }, { translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.dieText}>{value ?? "-"}</Text>
    </Animated.View>
  );
});

export default memo(function Dice({ d1, d2, mode = 2 }) {
  // Re-trigger animation even if the rolled number repeats
  const [trigger, setTrigger] = useState(0);
  const prev = useRef([null, null]);

  useEffect(() => {
    const [p1, p2] = prev.current;
    if (d1 !== p1 || d2 !== p2) setTrigger((k) => k + 1);
    prev.current = [d1, d2];
  }, [d1, d2]);

  if (mode === 1) {
    return (
      <View style={styles.row}>
        <Die value={d1} trigger={trigger} />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Die value={d1} trigger={trigger} />
      <View style={{ width: STAGGER_MS / 3 }} />
      <Die value={d2} trigger={trigger} delayMs={STAGGER_MS} />
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 8 },
  die: { width: 76, height: 76, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  dieText: { fontSize: 30, fontWeight: "800" },
});
