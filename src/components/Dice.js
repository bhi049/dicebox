// src/components/Dice.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "../theme/theme";

const ROLL_MS = 550;      // spin + bounce duration
const SCRAMBLE_MS = 60;   // face scramble speed
const STAGGER_MS = 120;   // roll stagger between dice
const SPLIT_MS = 180;     // slide apart/together duration (mode switch)
const OFFSET = 24;        // how far dice slide from center in 2-die mode

function randFace() {
  return Math.floor(Math.random() * 6) + 1;
}

function Die({
  value,
  animateKey,
  delayMs = 0,
  extraTransform = [],
  extraScaleValue, // Animated.Value or number
}) {
  const t = useTheme();
  const [displayValue, setDisplayValue] = useState(value ?? "-");

  const rot = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const scrambleRef = useRef(null);
  const startTimerRef = useRef(null);

  // Roll animation (spin + bounce + scramble)
  useEffect(() => {
    if (!animateKey) {
      setDisplayValue(value ?? "-");
      return;
    }

    startTimerRef.current && clearTimeout(startTimerRef.current);
    startTimerRef.current = setTimeout(() => {
      if (value != null) {
        scrambleRef.current && clearInterval(scrambleRef.current);
        scrambleRef.current = setInterval(() => setDisplayValue(randFace()), SCRAMBLE_MS);
      } else {
        setDisplayValue("-");
      }

      rot.setValue(0);
      bounce.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(rot,   { toValue: 1, duration: ROLL_MS, useNativeDriver: true }),
          Animated.timing(bounce,{ toValue: 1, duration: ROLL_MS, useNativeDriver: true }),
        ]),
        Animated.spring(bounce, { toValue: 0, friction: 5, useNativeDriver: true }),
      ]).start(() => {
        scrambleRef.current && clearInterval(scrambleRef.current);
        setDisplayValue(value ?? "-");
      });
    }, delayMs);

    return () => {
      startTimerRef.current && clearTimeout(startTimerRef.current);
      scrambleRef.current && clearInterval(scrambleRef.current);
    };
  }, [animateKey, value, delayMs, rot, bounce]);

  const rotateZ = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const bounceScale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const transforms = [
    ...(extraTransform || []),                                // slide from parent
    { rotateZ },
    { translateY },
    ...(extraScaleValue ? [{ scale: extraScaleValue }] : []), // gentle emphasis in 1-die mode
    { scale: bounceScale },                                   // bounce scale
  ];

  return (
    <Animated.View
      style={[
        styles.die,
        {
          backgroundColor: t.diceBg,
          borderRadius: t.radius,
          borderColor: t.border,
          transform: transforms,
        },
      ]}
    >
      <Text style={styles.dieText}>{displayValue}</Text>
    </Animated.View>
  );
}

/**
 * Props:
 *  - d1, d2: numbers | null
 *  - mode: 1 | 2  (when 1, we animate die #2 away & recenter die #1)
 */
export default function Dice({ d1, d2, mode = 2 }) {
  const [animKey, setAnimKey] = useState(0);
  const prev = useRef([null, null]);

  // Mode transition animators
  const [showTwo, setShowTwo] = useState(mode === 2);                   // keep die #2 mounted while fading out
  const die2Fade = useRef(new Animated.Value(mode === 2 ? 1 : 0)).current;
  const splitAnim = useRef(new Animated.Value(mode === 2 ? 1 : 0)).current; // 0 = centered (1 die), 1 = split (2 dice)

  // Trigger roll animation when faces change
  useEffect(() => {
    const [p1, p2] = prev.current;
    const changed = (d1 != null && d1 !== p1) || (d2 != null && d2 !== p2);
    if (changed) setAnimKey((k) => k + 1);
    prev.current = [d1, d2];
  }, [d1, d2]);

  // Animate two<->one transitions (reversible)
  useEffect(() => {
    if (mode === 2) {
      setShowTwo(true);
      Animated.parallel([
        Animated.timing(splitAnim, { toValue: 1, duration: SPLIT_MS, useNativeDriver: true }),
        Animated.timing(die2Fade,  { toValue: 1, duration: 160,     useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(splitAnim, { toValue: 0, duration: SPLIT_MS, useNativeDriver: true }),
        Animated.timing(die2Fade,  { toValue: 0, duration: 140,     useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) setShowTwo(false); });
    }
  }, [mode, splitAnim, die2Fade]);

  // Slide apart/together based on splitAnim
  const die1Shift = splitAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -OFFSET] });
  const die2Shift = splitAnim.interpolate({ inputRange: [0, 1], outputRange: [0,  OFFSET] });
  // Gentle emphasis scale on single-die mode (also reversible)
  const die1Scale = splitAnim.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.0] });

  if (!showTwo && mode === 1) {
    // Single, centered die
    return (
      <View style={styles.row}>
        <Die value={d1} animateKey={animKey} extraScaleValue={die1Scale} />
      </View>
    );
  }

  // Two dice with reversible slide + fade for die #2
  return (
    <View style={styles.row}>
      <Die
        value={d1}
        animateKey={animKey}
        extraScaleValue={die1Scale}
        extraTransform={[{ translateX: die1Shift }]}
        delayMs={0}
      />
      <Animated.View style={{ opacity: die2Fade, transform: [{ translateX: die2Shift }] }}>
        <Die value={d2} animateKey={animKey} delayMs={STAGGER_MS} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 8 },
  die: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  dieText: { fontSize: 30, fontWeight: "800" },
});
