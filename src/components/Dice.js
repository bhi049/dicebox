// src/components/Dice.js
import React, { useEffect, useRef, useState, memo } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useTheme } from "../theme/theme";

// ——— Size ———
const DIE = 68;
const GAP = 14;
const SAFE = 16;                 // extra vertical headroom for 45° rotation
const STAGE_W = DIE * 2 + GAP;
const STAGE_H = DIE + SAFE * 2;  // taller so spinning corners never clip
const CENTER_LEFT = (STAGE_W - DIE) / 2;

// ——— Animation ———
const ROLL_MS = 500;
const STAGGER_MS = 120;
const SPLIT_MS = 220;

const Die = memo(function Die({ value, trigger, delayMs = 0, extraTransform = [], extraScale }) {
  const t = useTheme();
  const rot = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rot.setValue(0);
    lift.setValue(0);
    const anim = Animated.sequence([
      Animated.delay(delayMs),
      Animated.parallel([
        Animated.timing(rot,  { toValue: 1, duration: ROLL_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(lift, { toValue: 1, duration: ROLL_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.spring(lift, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [trigger, delayMs, rot, lift]);

  const rotateZ    = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const bounce     = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  const transforms = [
    ...(extraTransform || []),
    { rotateZ },
    { translateY },
    ...(extraScale ? [{ scale: extraScale }] : []),
    { scale: bounce },
  ];

  return (
    <Animated.View
      style={[
        styles.die,
        { backgroundColor: t.diceBg, borderRadius: t.radius, borderColor: t.border, transform: transforms },
        { renderToHardwareTextureAndroid: true, shouldRasterizeIOS: true },
      ]}
    >
      <Text style={styles.dieText}>{value ?? "-"}</Text>
    </Animated.View>
  );
});

export default memo(function Dice({ d1, d2, mode = 2 }) {
  // trigger roll anim on any value change
  const [trigger, setTrigger] = useState(0);
  const prev = useRef([null, null]);
  useEffect(() => {
    const [p1, p2] = prev.current;
    if (d1 !== p1 || d2 !== p2) setTrigger((k) => k + 1);
    prev.current = [d1, d2];
  }, [d1, d2]);

  // reversible one↔two mode transition (native)
  const split = useRef(new Animated.Value(mode === 2 ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(split, {
      toValue: mode === 2 ? 1 : 0,
      duration: SPLIT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, split]);

  const SHIFT = (DIE + GAP) / 2;
  const die1Shift   = split.interpolate({ inputRange: [0, 1], outputRange: [0, -SHIFT] });
  const die2Shift   = split.interpolate({ inputRange: [0, 1], outputRange: [0,  SHIFT] });
  const die2Opacity = split;
  const die1Scale   = split.interpolate({ inputRange: [0, 1], outputRange: [1.03, 1.0] });
  const delay2      = mode === 2 ? STAGGER_MS : 0;

  return (
    <View style={styles.stage}>
      <Die value={d1} trigger={trigger} extraScale={die1Scale} extraTransform={[{ translateX: die1Shift }]} />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: CENTER_LEFT,
          opacity: die2Opacity,
          transform: [{ translateX: die2Shift }],
        }}
      >
        <Die value={d2} trigger={trigger} delayMs={delay2} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  stage: {
    width: STAGE_W,
    height: STAGE_H,
    alignItems: "center",
    justifyContent: "center",
    // IMPORTANT: allow rotated corners to render outside bounds
    overflow: "visible",
    marginVertical: 8,
  },
  die: {
    width: DIE,
    height: DIE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  dieText: { fontSize: 28, fontWeight: "800" },
});
