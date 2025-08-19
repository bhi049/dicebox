// src/components/ConfettiOverlay.js
import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from "react-native";

const { width, height } = Dimensions.get("window");

/** Falling sparkles */
function Sparkle({ seed }) {
  const prog = useRef(new Animated.Value(0)).current;

  // randomize each piece deterministically by "seed"
  const x = useMemo(() => Math.random() * width, [seed]);
  const drift = useMemo(() => Math.random() * 60 - 30, [seed]);
  const glyph = useMemo(() => (["✨", "✦", "✧", "★", "☆"])[Math.floor(Math.random() * 5)], [seed]);
  const size = useMemo(() => 12 + Math.random() * 10, [seed]);
  const delay = useMemo(() => Math.random() * 250, [seed]);
  const duration = useMemo(() => 1200 + Math.random() * 700, [seed]);

  const rotate = prog.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const translateY = prog.interpolate({ inputRange: [0, 1], outputRange: [-40, height + 40] });
  const translateX = prog.interpolate({ inputRange: [0, 1], outputRange: [x, x + drift] });
  const opacity = prog.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });

  useEffect(() => {
    const a = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(prog, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    ]);
    a.start(() => prog.setValue(0));
    return () => a.stop();
  }, [delay, duration, prog, seed]);

  return (
    <Animated.View style={[styles.particle, { transform: [{ translateX }, { translateY }, { rotate }], opacity }]}>
      <Text style={{ fontSize: size }}>{glyph}</Text>
    </Animated.View>
  );
}

/** Radial burst from a point */
function Firework({ seed, cx, cy }) {
  const prog = useRef(new Animated.Value(0)).current;
  const count = 12;

  useEffect(() => {
    const a = Animated.timing(prog, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start(() => prog.setValue(0));
    return () => a.stop();
  }, [prog, seed]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = 80 + Math.random() * 40;
        const tx = prog.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * r] });
        const ty = prog.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * r] });
        const opacity = prog.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View key={i} style={[styles.particle, { left: cx, top: cy, transform: [{ translateX: tx }, { translateY: ty }], opacity }]}>
            <Text style={{ fontSize: 14 }}>✹</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Centered single burst */
function Burst({ seed }) {
  const cx = width / 2;
  const cy = height * 0.35;
  return <Firework seed={seed} cx={cx} cy={cy} />;
}

/**
 * ConfettiOverlay
 * Props:
 *  - effect: "sparkles" | "fireworks" | "burst"
 *  - visible: boolean
 *  - burstKey: any   (change to re-run the effect)
 */
export default function ConfettiOverlay({ effect = "sparkles", visible, burstKey }) {
  if (!visible) return null;

  if (effect === "sparkles") {
    const n = 36;
    return (
      <View pointerEvents="none" style={styles.wrap} key={`spark-${burstKey}`}>
        {Array.from({ length: n }, (_, i) => <Sparkle key={i} seed={i + Math.random()} />)}
      </View>
    );
  }

  if (effect === "burst") {
    return (
      <View pointerEvents="none" style={styles.wrap} key={`burst-${burstKey}`}>
        <Burst seed={Math.random()} />
      </View>
    );
  }

  // fireworks: a few radial pops across screen
  const pops = 4;
  return (
    <View pointerEvents="none" style={styles.wrap} key={`fw-${burstKey}`}>
      {Array.from({ length: pops }, (_, i) => {
        const cx = width * (0.2 + Math.random() * 0.6);
        const cy = height * (0.25 + Math.random() * 0.25);
        return <Firework key={i} seed={i + Math.random()} cx={cx} cy={cy} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  particle: { position: "absolute" },
});
