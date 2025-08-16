import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Dice from "../components/Dice";
import TileGrid from "../components/TileGrid";
import { useTheme } from "../theme/theme";
import { rollDie, getValidCombos } from "../logic/game";
import { recordGame, getStatsOrDefault } from "../storage/stats";
import ResultModal from "../components/ResultModal";

export default function GameScreen({ navigation }) {
  const t = useTheme();
  const numbers = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const [available, setAvailable] = useState(new Set(numbers));
  const [selected, setSelected] = useState(new Set());
  const [dice, setDice] = useState([null, null]);           // [d1, d2|null]
  const [phase, setPhase] = useState("idle");               // idle | rolled | gameover | win
  const [deadRoll, setDeadRoll] = useState(false);          // rolled but no valid moves

  const [diceMode, setDiceMode] = useState(2);              // 1 or 2 dice; used for Skip re-roll
  const [skipsRemaining, setSkipsRemaining] = useState(3);  // 3 per game
  const [rollCount, setRollCount] = useState(0);            // accepted rolls (skips don't count)
  const recordedRef = useRef(false);

  // Result modal + latest stats
  const [result, setResult] = useState(null);               // { type: 'win'|'loss', rollsUsed, leftoverSum }
  const [latestStats, setLatestStats] = useState(null);

  // Target: one die → that value; two dice → sum; no dice → null
  const target = useMemo(() => {
    const [d1, d2] = dice;
    if (d1 == null && d2 == null) return null;
    if (d1 != null && d2 == null) return d1;
    if (d1 != null && d2 != null) return d1 + d2;
    return null;
  }, [dice]);

  const validCombos = useMemo(() => {
    if (!target || phase !== "rolled") return [];
    return getValidCombos(available, target);
  }, [available, target, phase]);

  // Detect a dead roll: if no combos exist after a roll
  useEffect(() => {
    if (phase === "rolled" && target && validCombos.length === 0) {
      if (skipsRemaining > 0) {
        if (!deadRoll) setDeadRoll(true); // allow user to skip instead of instant game over
      } else {
        setPhase("gameover");
        setSelected(new Set());
      }
    }
  }, [phase, target, validCombos.length, skipsRemaining, deadRoll]);

  // When game ends, record stats once and show modal
  useEffect(() => {
    (async () => {
      if ((phase === "win" || phase === "gameover") && !recordedRef.current) {
        recordedRef.current = true;

        if (phase === "win") {
          await recordGame({ win: true, perfectShut: true, rollsUsed: rollCount });
          setResult({ type: "win", rollsUsed: rollCount, leftoverSum: 0 });
        } else {
          const leftoverSum = Array.from(available).reduce((a, b) => a + b, 0);
          await recordGame({ win: false, leftoverSum });
          setResult({ type: "loss", rollsUsed: rollCount, leftoverSum });
        }
        const s = await getStatsOrDefault();
        setLatestStats(s);
      }
    })();
  }, [phase, rollCount, available]);

  function doRoll(mode = 2) {
    if (mode === 1) setDice([rollDie(), null]);
    else setDice([rollDie(), rollDie()]);
    setPhase("rolled");
    setDeadRoll(false);
  }

  function onRoll(mode = 2) {
    if (phase !== "idle") return;
    setSelected(new Set());
    setDiceMode(mode);
    doRoll(mode);
    setRollCount((c) => c + 1); // counts only accepted rolls
  }

  function onSkip() {
    if (phase !== "rolled" || skipsRemaining <= 0) return;
    // Skip: re-roll immediately, do NOT increment rollCount
    setSelected(new Set());
    setSkipsRemaining((s) => Math.max(0, s - 1));
    doRoll(diceMode); // re-roll with last chosen dice mode
  }

  function onToggle(n) {
    if (phase !== "rolled" || deadRoll || !available.has(n)) return;
    const next = new Set(selected);
    next.has(n) ? next.delete(n) : next.add(n);

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
    if (phase !== "rolled" || deadRoll || !target) return;
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

    if (nextAvailable.size === 0) setPhase("win");
    else setPhase("idle");
  }

  function resetGameState() {
    setAvailable(new Set(numbers));
    setSelected(new Set());
    setDice([null, null]);
    setPhase("idle");
    setDeadRoll(false);
    setDiceMode(2);
    setSkipsRemaining(3);
    setRollCount(0);
    recordedRef.current = false;
  }

  function handlePlayAgain() {
    setResult(null);
    resetGameState();
  }

  const primaryLabel =
    phase === "idle" ? "Roll"
    : phase === "rolled" && deadRoll ? `No Moves — Skip (${skipsRemaining})`
    : phase === "rolled" ? "Confirm"
    : (phase === "win" || phase === "gameover") ? "New Game"
    : "Roll";

  function primaryAction() {
    if (phase === "rolled" && deadRoll) onSkip();
    else if (phase === "rolled") onConfirm();
    else if (phase === "idle") onRoll(diceMode);
    else resetGameState();
  }

  const isIdle = phase === "idle";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      {/* Top area */}
      <View style={styles.header}>
        <Text style={styles.title}>DiceBox</Text>

        {/* Mode selector & counters */}
        <View style={styles.topRow}>
          {/* Segmented Roll mode chips */}
          <View style={styles.segment}>
            <TouchableOpacity
              onPress={() => isIdle && setDiceMode(1)}
              activeOpacity={0.9}
              style={[styles.segBtn, diceMode === 1 && styles.segBtnActive]}
            >
              <Text style={[styles.segTxt, diceMode === 1 && styles.segTxtActive]}>Roll 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => isIdle && setDiceMode(2)}
              activeOpacity={0.9}
              style={[styles.segBtn, diceMode === 2 && styles.segBtnActive]}
            >
              <Text style={[styles.segTxt, diceMode === 2 && styles.segTxtActive]}>Roll 2</Text>
            </TouchableOpacity>
          </View>

          {/* Status pills */}
          <View style={styles.pills}>
            <View style={styles.pill}><Text style={styles.pillLabel}>Rolls</Text><Text style={styles.pillVal}>{rollCount}</Text></View>
            <View style={styles.pill}><Text style={styles.pillLabel}>Skips</Text><Text style={styles.pillVal}>{skipsRemaining}</Text></View>
          </View>
        </View>
      </View>

      {/* Dice + target */}
      <View style={styles.center}>
        <Dice d1={dice[0]} d2={dice[1]} />
        <Text style={styles.caption}>
          {target ? `Target: ${target}` : "Choose a roll to start"}
        </Text>

        {/* Dead roll banner */}
        {phase === "rolled" && deadRoll && (
          <TouchableOpacity onPress={onSkip} activeOpacity={0.9} style={styles.deadBanner}>
            <Text style={styles.deadBannerTxt}>
              No valid combos for {target}. Tap to Skip ({skipsRemaining} left)
            </Text>
          </TouchableOpacity>
        )}

        {/* Grid */}
        <View style={{ marginTop: 8 }}>
          <TileGrid
            numbers={numbers}
            availableSet={available}
            selectedSet={selected}
            onToggle={onToggle}
            disabled={phase !== "rolled" || deadRoll}
          />
        </View>

        {/* Helper text */}
        <Text style={styles.helper}>
          {phase === "rolled" && !deadRoll
            ? `${validCombos.length} valid ${validCombos.length === 1 ? "combo" : "combos"}`
            : phase === "idle"
            ? "Select Roll 1 / Roll 2 to begin."
            : ""}
        </Text>

        {/* Action buttons – RIGHT UNDER THE GRID */}
        <View style={styles.actions}>
          {isIdle ? (
            <PrimaryButton
              title={`Roll ${diceMode}`}
              onPress={() => onRoll(diceMode)}
              style={styles.actionPrimary}
            />
          ) : (
            <>
              <PrimaryButton
                title={primaryLabel}
                onPress={primaryAction}
                style={styles.actionPrimary}
              />
              {phase === "rolled" && !deadRoll && (
                <PrimaryButton
                  title={`Skip (${skipsRemaining})`}
                  onPress={onSkip}
                  disabled={skipsRemaining === 0}
                  style={[
                    styles.actionSecondary,
                    { backgroundColor: skipsRemaining === 0 ? "#cbd5e1" : "#f59e0b" },
                  ]}
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* Result Modal */}
      <ResultModal
        visible={!!result}
        type={result?.type === "win" ? "win" : result?.type === "loss" ? "loss" : null}
        rollsUsed={result?.rollsUsed ?? 0}
        leftoverSum={result?.leftoverSum ?? null}
        stats={latestStats}
        onPlayAgain={handlePlayAgain}
        onClose={() => { setResult(null); navigation.goBack(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: "800" },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  segment: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    padding: 4,
  },
  segBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  segBtnActive: { backgroundColor: "#4f46e5" },
  segTxt: { fontWeight: "700", color: "#334155" },
  segTxtActive: { color: "white" },

  pills: { flexDirection: "row", gap: 8 },
  pill: {
    minWidth: 66,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    alignItems: "center",
  },
  pillLabel: { fontSize: 11, color: "#64748b" },
  pillVal: { fontSize: 16, fontWeight: "800", color: "#0f172a" },

  center: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 12 },
  caption: { marginTop: 6, color: "#475569" },

  deadBanner: {
    marginTop: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  deadBannerTxt: { color: "#991b1b", fontWeight: "700" },

  helper: { marginTop: 10, color: "#64748b", textAlign: "center" },

  actions: {
    marginTop: 14,
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  actionPrimary: { width: "90%" },
  actionSecondary: { width: 180 },
});
