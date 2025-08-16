import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Dice from "../components/Dice";
import TileGrid from "../components/TileGrid";
import { useTheme } from "../theme/theme";
import { rollDie, getValidCombos } from "../logic/game";

export default function GameScreen({ navigation }) {
  const t = useTheme();
  const numbers = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const [available, setAvailable] = useState(new Set(numbers));
  const [selected, setSelected] = useState(new Set());
  const [dice, setDice] = useState([null, null]);
  const [phase, setPhase] = useState("idle"); // idle | rolled | gameover | win

  const target = dice[0] && dice[1] ? dice[0] + dice[1] : null;
  const validCombos = useMemo(() => {
    if (!target || phase !== "rolled") return [];
    return getValidCombos(available, target);
  }, [available, target, phase]);

  useEffect(() => {
    if (phase === "rolled" && target && validCombos.length === 0) {
      setPhase("gameover");
      setSelected(new Set());
      Alert.alert("No moves", "Game over. No combination matches the roll.");
    }
  }, [phase, target, validCombos.length]);

  function onRoll() {
    setSelected(new Set());
    setDice([rollDie(), rollDie()]);
    setPhase("rolled");
  }

  function onToggle(n) {
    if (phase !== "rolled" || !available.has(n)) return;
    const next = new Set(selected);
    next.has(n) ? next.delete(n) : next.add(n);

    // keep sum <= target and prefix of some valid combo
    const sum = Array.from(next).reduce((a, b) => a + b, 0);
    if (target && sum > target) return;

    const possible = validCombos.some((combo) => {
      for (const x of next) if (!combo.includes(x)) return false;
      return true;
    });
    if (!possible) return;

    setSelected(next);
  }

  function onConfirm() {
    if (phase !== "rolled" || !target) return;
    const sum = Array.from(selected).reduce((a, b) => a + b, 0);
    if (sum !== target) {
      Alert.alert("Not enough", `Select tiles totaling ${target}.`);
      return;
    }
    const sel = Array.from(selected).sort((a, b) => a - b);
    const ok = validCombos.some((c) => c.length === sel.length && c.every((v, i) => v === sel[i]));
    if (!ok) {
      Alert.alert("Invalid", "That combination isn't allowed.");
      return;
    }
    const nextAvailable = new Set(available);
    sel.forEach((n) => nextAvailable.delete(n));
    setAvailable(nextAvailable);
    setSelected(new Set());
    setDice([null, null]);
    setPhase(nextAvailable.size === 0 ? "win" : "idle");

    if (nextAvailable.size === 0) {
      Alert.alert("You win! 🎉", "Perfect shut.", [{ text: "OK" }]);
      // TODO: record win stat here
    }
  }

  function onNewGame() {
    setAvailable(new Set(numbers));
    setSelected(new Set());
    setDice([null, null]);
    setPhase("idle");
  }

  const primaryLabel =
    phase === "idle" ? "Roll" : phase === "rolled" ? "Confirm" : (phase === "win" || phase === "gameover") ? "New Game" : "Roll";

  function primaryAction() {
    if (phase === "rolled") onConfirm();
    else if (phase === "idle") onRoll();
    else onNewGame();
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Text style={styles.title}>Game</Text>
      <Dice d1={dice[0]} d2={dice[1]} />
      <Text style={styles.caption}>{target ? `Target: ${target}` : "Roll to start"}</Text>

      <TileGrid
        numbers={numbers}
        availableSet={available}
        selectedSet={selected}
        onToggle={onToggle}
        disabled={phase !== "rolled"}
      />

      <Text style={styles.helper}>
        {phase === "rolled" ? `${validCombos.length} valid ${validCombos.length === 1 ? "combo" : "combos"}`
          : phase === "win" ? "You cleared all numbers! 🎉"
          : phase === "gameover" ? "No valid moves. Game over."
          : "Tap Roll to begin."}
      </Text>

      <View style={{ height: 12 }} />
      <PrimaryButton title={primaryLabel} onPress={primaryAction} style={{ width: 220 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 56, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800" },
  caption: { marginVertical: 8, color: "#475569" },
  helper: { marginTop: 12, color: "#64748b" },
});
