import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Dice from "../components/Dice";
import TileGrid from "../components/TileGrid";
import { useTheme } from "../theme/theme";
import { rollDie, getValidCombos } from "../logic/game";
import { recordGame, getStatsOrDefault } from "../storage/stats";
import ResultModal from "../components/ResultModal";
import { saveGameState, loadGameState, clearGameState } from "../storage/gameState"; 

const INITIAL_SKIPS = 5;
const TAP_COOLDOWN_MS = 350; // ignore very-rapid repeat taps on actions

export default function GameScreen({ navigation }) {
  const t = useTheme();
  const numbers = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const [available, setAvailable] = useState(new Set(numbers));
  const [selected, setSelected] = useState(new Set());
  const [dice, setDice] = useState([null, null]);           // [d1, d2|null]
  const [phase, setPhase] = useState("idle");               // idle | rolled | stuck | gameover | win
  const [deadRoll, setDeadRoll] = useState(false);          // rolled but have skips to use

  const [diceMode, setDiceMode] = useState(2);              // 1 or 2 dice; used for Skip re-roll
  const [skipsRemaining, setSkipsRemaining] = useState(INITIAL_SKIPS);
  const [rollCount, setRollCount] = useState(0);            // accepted rolls (skips don't count)

  // Block input while dice visually roll
  const [rollingAnim, setRollingAnim] = useState(false);
  const rollAnimTimer = useRef(null);

  // Debounce very fast taps on Confirm/Skip
  const lastTapRef = useRef(0);

  const recordedRef = useRef(false);

  // Persist/resume control
  const hydratingRef = useRef(true); 

  // Result modal + latest stats
  const [result, setResult] = useState(null);               // { type, rollsUsed, leftoverSum, perfect }
  const [latestStats, setLatestStats] = useState(null);

  // ---- Hydrate saved game on mount (if not finished) ----
  useEffect(() => {
    (async () => {
      const saved = await loadGameState();
      if (saved && saved.phase !== "win" && saved.phase !== "gameover") {
        setAvailable(saved.available);
        setSelected(saved.selected);
        setDice(saved.dice);
        setPhase(saved.phase);
        setSkipsRemaining(saved.skipsRemaining);
        setRollCount(saved.rollCount);
        setDiceMode(saved.diceMode);
      }
      hydratingRef.current = false;
    })();
  }, []);

  // ---- Save on any core state change (except while hydrating or after finish) ----
  useEffect(() => {
    if (hydratingRef.current) return;

    if (phase === "win" || phase === "gameover") {
      clearGameState();
      return;
    }

    saveGameState({
      available, selected, dice, phase,
      skipsRemaining, rollCount, diceMode,
    });
  }, [available, selected, dice, phase, skipsRemaining, rollCount, diceMode]);

  // Target: one die → that value; two dice → sum; no dice → null
  const target = useMemo(() => {
    const [d1, d2] = dice;
    if (d1 == null && d2 == null) return null;
    if (d1 != null && d2 == null) return d1;
    if (d1 != null && d2 != null) return d1 + d2;
    return null;
  }, [dice]);

  // Precompute valid combos (sorted for reliable comparison)
  const validCombos = useMemo(() => {
    if (!target || phase !== "rolled") return [];
    const combos = getValidCombos(available, target);
    return combos.map((c) => [...c].sort((a, b) => a - b));
  }, [available, target, phase]);

  // Helpers based on current selection
  const selectedArr = useMemo(() => [...selected].sort((a, b) => a - b), [selected]);
  const selectedSum = useMemo(() => selectedArr.reduce((a, b) => a + b, 0), [selectedArr]);

  const canConfirm = useMemo(() => {
    if (phase !== "rolled" || rollingAnim || deadRoll || !target) return false;
    if (selectedSum !== target) return false;
    return validCombos.some(
      (c) => c.length === selectedArr.length && c.every((v, i) => v === selectedArr[i])
    );
  }, [phase, rollingAnim, deadRoll, target, selectedSum, selectedArr, validCombos]);

  // Detect a dead roll -> either "deadRoll" (skips available) or "stuck" (no skips left).
  useEffect(() => {
    if (phase === "rolled" && target && validCombos.length === 0) {
      setSelected(new Set());
      if (skipsRemaining > 0) {
        setDeadRoll(true);
      } else {
        setDeadRoll(false);
        setPhase("stuck"); // show “no moves left” UI instead of recording loss
      }
    }
  }, [phase, target, validCombos.length, skipsRemaining]);

  // Record stats once + show modal (win or give up)
  useEffect(() => {
    (async () => {
      if ((phase === "win" || phase === "gameover") && !recordedRef.current) {
        recordedRef.current = true;

        if (phase === "win") {
          const perfect = skipsRemaining === INITIAL_SKIPS; // only perfect if NO skips used
          await recordGame({ win: true, perfectShut: perfect, rollsUsed: rollCount });
          setResult({ type: "win", rollsUsed: rollCount, leftoverSum: 0, perfect });
        } else {
          const leftoverSum = Array.from(available).reduce((a, b) => a + b, 0);
          await recordGame({ win: false, leftoverSum });
          setResult({ type: "loss", rollsUsed: rollCount, leftoverSum, perfect: false });
        }
        const s = await getStatsOrDefault();
        setLatestStats(s);
      }
    })();
  }, [phase, rollCount, available, skipsRemaining]);

  function startRollAnimationWindow() {
    rollAnimTimer.current && clearTimeout(rollAnimTimer.current);
    setRollingAnim(true);
    rollAnimTimer.current = setTimeout(() => setRollingAnim(false), 620);
  }

  function doRoll(mode = 2) {
    if (mode === 1) setDice([rollDie(), null]);
    else setDice([rollDie(), rollDie()]);
    setPhase("rolled");
    setDeadRoll(false);
    startRollAnimationWindow();
  }

  function onRoll(mode = 2) {
    if (phase !== "idle") return;
    setSelected(new Set());
    setDiceMode(mode);
    doRoll(mode);
    setRollCount((c) => c + 1);
  }

  function guardRapidTap() {
    const now = Date.now();
    if (now - lastTapRef.current < TAP_COOLDOWN_MS) return false;
    lastTapRef.current = now;
    return true;
  }

  // Skip returns to idle (no auto re-roll)
  function onSkip() {
    if (!guardRapidTap()) return;
    if (phase !== "rolled" || skipsRemaining <= 0) return;
    setSelected(new Set());
    setSkipsRemaining((s) => Math.max(0, s - 1));
    setDice([null, null]);
    setDeadRoll(false);
    setPhase("idle"); // back to choosing Roll 1 or Roll 2
  }

  function onToggle(n) {
    if (phase !== "rolled" || rollingAnim || deadRoll || !available.has(n)) return;
    const next = new Set(selected);
    next.has(n) ? next.delete(n) : next.add(n);

    const sum = Array.from(next).reduce((a, b) => a + b, 0);
    if (target && sum > target) return;

    const nextArr = [...next].sort((a, b) => a - b);
    const subsetOK = validCombos.some((combo) => nextArr.every((x) => combo.includes(x)));
    if (!subsetOK) return;

    setSelected(next);
  }

  function onConfirm() {
    if (!guardRapidTap()) return;
    if (!canConfirm) return;

    const nextAvailable = new Set(available);
    selectedArr.forEach((n) => nextAvailable.delete(n));
    setAvailable(nextAvailable);
    setSelected(new Set());
    setDice([null, null]);

    if (nextAvailable.size === 0) setPhase("win");
    else setPhase("idle");
  }

  function onGiveUp() {
    setPhase("gameover");
  }

  function onGetMoreSkips() {
    Alert.alert("Get More Skips", "Coming soon! You'll be able to watch an ad to get +3 skips.");
  }

  function resetGameState() {
    setAvailable(new Set(numbers));
    setSelected(new Set());
    setDice([null, null]);
    setPhase("idle");
    setDeadRoll(false);
    setDiceMode(2);
    setSkipsRemaining(INITIAL_SKIPS);
    setRollCount(0);
    setRollingAnim(false);
    recordedRef.current = false;
    rollAnimTimer.current && clearTimeout(rollAnimTimer.current);
    lastTapRef.current = 0;
    clearGameState(); // ⬅️ also clear persisted game when you hard-reset
  }

  function handlePlayAgain() {
    setResult(null);
    resetGameState();
  }

  const handlePrimaryPress = useCallback(() => {
    if (phase === "rolled" && deadRoll) onSkip();
    else if (phase === "rolled") onConfirm();
    else if (phase === "idle") onRoll(diceMode);
    else resetGameState();
  }, [phase, deadRoll, diceMode, canConfirm]);

  const primaryLabel =
    phase === "idle" ? `Roll ${diceMode}`
    : phase === "rolled" && deadRoll ? `No Moves — Skip (${skipsRemaining})`
    : phase === "rolled" && rollingAnim ? "Rolling…"
    : phase === "rolled" ? "Confirm"
    : (phase === "win" || phase === "gameover") ? "New Game"
    : "Roll";

  // Confirm should be clickable ONLY when canConfirm; disabled Confirm must NEVER block taps to Skip
  const primaryDisabled =
    (phase === "rolled" && deadRoll && skipsRemaining === 0) ||
    (phase === "rolled" && !deadRoll && (rollingAnim || !canConfirm));

  const showSkip = phase === "rolled" && !deadRoll;
  const skipDisabled = skipsRemaining === 0;

  const isIdle = phase === "idle";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      {/* Top area */}
      <View style={styles.header}>
        <Text style={styles.title}>DiceBox</Text>

        <View style={styles.topRow}>
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

          <View style={styles.pills}>
            <View style={styles.pill}><Text style={styles.pillLabel}>Rolls</Text><Text style={styles.pillVal}>{rollCount}</Text></View>
            <View style={styles.pill}><Text style={styles.pillLabel}>Skips</Text><Text style={styles.pillVal}>{skipsRemaining}</Text></View>
          </View>
        </View>
      </View>

      {/* Dice */}
      <View style={styles.center}>
        <Dice d1={dice[0]} d2={dice[1]} mode={diceMode} />

        {/* STATUS SLOT — fixed height, replaces Target when dead roll */}
        <View style={styles.statusSlot}>
          {phase === "rolled" && deadRoll ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                No valid combos for {target}. Use a Skip.
              </Text>
            </View>
          ) : (
            <Text style={styles.caption}>
              {target ? `Target: ${target}` : "Choose a roll to start"}
            </Text>
          )}
        </View>

        {/* Grid */}
        <View style={{ marginTop: 8 }}>
          <TileGrid
            numbers={numbers}
            availableSet={available}
            selectedSet={selected}
            onToggle={onToggle}
            disabled={phase !== "rolled" || deadRoll || rollingAnim || phase === "stuck"}
          />
        </View>

        {/* Helper text */}
        <Text style={styles.helper}>
          {phase === "stuck"
            ? "No valid moves and no skips left."
            : phase === "rolled" && !deadRoll
            ? (rollingAnim ? "Rolling…" : `${validCombos.length} valid ${validCombos.length === 1 ? "combo" : "combos"}`)
            : phase === "idle"
            ? "Select Roll 1 / Roll 2 to begin."
            : ""}
        </Text>

        {/* Actions under the grid */}
        {phase === "stuck" ? (
          <View style={[styles.actions, { gap: 10 }]}>
            <PrimaryButton title="Get More Skips" onPress={onGetMoreSkips} style={styles.actionPrimary} />
            <PrimaryButton title="Give Up" onPress={onGiveUp} style={[styles.actionPrimary, { backgroundColor: "#ef4444" }]} />
          </View>
        ) : (
          <View style={[styles.actions, { gap: 10 }]}>
            {isIdle ? (
              <PrimaryButton title={`Roll ${diceMode}`} onPress={() => onRoll(diceMode)} style={styles.actionPrimary} />
            ) : (
              <>
                <PrimaryButton
                  title={primaryLabel}
                  onPress={handlePrimaryPress}
                  disabled={primaryDisabled}
                  style={styles.actionPrimary}
                />
                {showSkip && (
                  <PrimaryButton
                    title={`Skip (${skipsRemaining})`}
                    onPress={onSkip}
                    disabled={skipDisabled}
                    style={[styles.actionSecondary, { backgroundColor: skipDisabled ? "#cbd5e1" : "#f59e0b" }]}
                  />
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* Result Modal */}
      <ResultModal
        visible={!!result}
        type={result?.type === "win" ? "win" : result?.type === "loss" ? "loss" : null}
        perfect={!!result?.perfect}
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
  segBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
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

  // Target / Dead-roll message placeholder with CONSTANT height
  statusSlot: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  statusBadge: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeText: { color: "#991b1b", fontWeight: "700" },

  caption: { color: "#475569" },

  helper: { marginTop: 10, color: "#64748b", textAlign: "center" },

  actions: { marginTop: 14, alignItems: "center", width: "100%" },
  actionPrimary: { width: "90%" },
  actionSecondary: { width: 180 },
});
