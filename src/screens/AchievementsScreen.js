import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useTheme } from "../theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { haptic } from "../utils/haptics";

import { ACHIEVEMENTS } from "../logic/achievements";
import { loadProgression, clearProgression } from "../storage/progression";

// ✅ corrected path
import { useCosmetics } from "../cosmetics/CosmeticsContext";

const COSMETIC_SECTIONS = [
  { type: "diceSkin", title: "Dice", icon: "🎲" },
  { type: "tileTheme", title: "Tiles", icon: "🔷" },
  { type: "confetti", title: "Confetti", icon: "🎉" },
  { type: "theme", title: "Theme", icon: "🎨" },
];

function SectionTitle({ children }) { return <Text style={styles.sectionTitle}>{children}</Text>; }
function Row({ children, dim }) { return <View style={[styles.row, dim && { opacity: 0.55 }]}>{children}</View>; }
function LockIcon({ color = "#334155" }) { return <Ionicons name="lock-closed-outline" size={16} color={color} />; }
function TrophyIcon() { return <Ionicons name="trophy" size={16} color="#16a34a" />; }

export default function AchievementsScreen({ navigation }) {
  const t = useTheme();
  const { inventory, equipped, equip, refresh: refreshCosmetics } = useCosmetics();
  const [achievementsState, setAchievementsState] = useState({});

  async function load() {
    const p = await loadProgression();
    setAchievementsState(p.achievements || {});
  }
  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  const isUnlocked = (id) => !!achievementsState?.[id]?.unlocked;
  const unlocked = ACHIEVEMENTS.filter(a => isUnlocked(a.id));
  const locked = ACHIEVEMENTS.filter(a => !isUnlocked(a.id));
  const niceName = (id) => id.replace(/[_-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const onEquip = async (type, id) => { await equip(type, id); haptic("select"); };
  const onUnequip = async (type) => { await equip(type, null); haptic("select"); };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <View className="header" style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <SectionTitle>Unlocked</SectionTitle>
          {unlocked.length === 0 ? (
            <Text style={styles.empty}>None yet — go play a round!</Text>
          ) : (
            unlocked.map(a => (
              <Row key={a.id}>
                <TrophyIcon />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  <Text style={styles.rowDesc}>{a.description}</Text>
                </View>
                <Text style={styles.emoji}>{a.icon}</Text>
              </Row>
            ))
          )}
        </View>

        <View style={styles.card}>
          <SectionTitle>Locked</SectionTitle>
          {locked.length === 0 ? (
            <Text style={styles.empty}>You’ve unlocked everything (for now)!</Text>
          ) : (
            locked.map(a => (
              <Row key={a.id} dim>
                <LockIcon />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  <Text style={styles.rowDesc}>{a.description}</Text>
                </View>
                <Text style={styles.emoji}>{a.icon}</Text>
              </Row>
            ))
          )}
        </View>

        <View style={styles.card}>
          <SectionTitle>Owned Cosmetics</SectionTitle>
          {[
            { type: "diceSkin", title: "Dice", icon: "🎲" },
            { type: "tileTheme", title: "Tiles", icon: "🔷" },
            { type: "confetti", title: "Confetti", icon: "🎉" },
            { type: "theme", title: "Theme", icon: "🎨" },
          ].map(({ type, title, icon }) => {
            const ownedIds = Object.keys(inventory?.[type] || {});
            const equippedId = equipped?.[type] ?? null;

            return (
              <View key={type} style={{ marginBottom: 10 }}>
                <Text style={styles.cosSectionTitle}>{icon} {title}</Text>
                {ownedIds.length === 0 ? (
                  <Text style={styles.emptySmall}>None yet — unlock some by earning achievements.</Text>
                ) : (
                  <View style={styles.chipsRow}>
                    <TouchableOpacity onPress={() => onUnequip(type)}
                      style={[styles.chip, !equippedId && styles.chipActive]}>
                      <Text style={!equippedId ? styles.chipActiveTxt : styles.chipTxt}>None</Text>
                    </TouchableOpacity>

                    {ownedIds.map(id => {
                      const active = equippedId === id;
                      return (
                        <TouchableOpacity key={id} onPress={() => onEquip(type, id)}
                          style={[styles.chip, active && styles.chipActive]}>
                          <Text style={active ? styles.chipActiveTxt : styles.chipTxt}>{niceName(id)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.cardTitle}>Manage</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() =>
              Alert.alert("Reset progression?", "Clears achievements and cosmetics.", [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: async () => {
                    await clearProgression();
                    await load();
                    await refreshCosmetics();
                  } },
              ])
            }>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.resetTxt}>Reset Progression</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backTxt: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800" },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: "#e5e7eb" },
  dangerCard: { borderColor: "#fee2e2" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  rowTitle: { fontWeight: "700", color: "#0f172a" },
  rowDesc: { color: "#475569" },
  emoji: { fontSize: 16 },
  cosSectionTitle: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
    borderColor: "#cbd5e1", backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipTxt: { color: "#0f172a", fontWeight: "600" },
  chipActiveTxt: { color: "white", fontWeight: "700" },
  empty: { color: "#64748b" }, emptySmall: { color: "#94a3b8", paddingVertical: 2 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 8 },
  resetBtn: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, justifyContent: "center" },
  resetTxt: { color: "#ef4444", fontWeight: "700" },
});
