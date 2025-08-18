// src/screens/SettingsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import ToggleSwitch from "../components/ToggleSwitch";
import { loadPrefs, savePrefs, DEFAULT_PREFS } from "../storage/prefs";
import { haptic, setHapticsEnabled } from "../utils/haptics";
import { useTheme } from "../theme/theme";

export default function SettingsScreen({ navigation }) {
  const t = useTheme();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      const loaded = await loadPrefs();
      setPrefs(loaded);
      setHapticsEnabled(!!loaded.haptics);
    })();
  }, []);

  async function update(partial) {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    await savePrefs(next);
  }

  function handleBack() {
    haptic("select");
    navigation.goBack();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.container}>
        {/* Header with Back */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.85}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          {/* spacer to balance layout */}
          <View style={{ width: 64 }} />
        </View>

        <Text style={styles.caption}>Tune the vibe. Changes are saved automatically.</Text>

        <View style={styles.card}>
          <ToggleSwitch
            label="Haptic Feedback"
            value={prefs.haptics}
            onChange={async (v) => {
              setHapticsEnabled(v);
              await update({ haptics: v });
              if (v) haptic("select");
            }}
          />
          <View style={styles.divider} />

          <ToggleSwitch
            label="Sound Effects"
            value={prefs.sounds}
            onChange={async (v) => {
              await update({ sounds: v });
              // (coming soon) wire to sound engine
              haptic("light");
            }}
          />
          <View style={styles.divider} />

          <ToggleSwitch
            label="Dark Theme"
            value={prefs.darkMode}
            onChange={async (v) => {
              await update({ darkMode: v });
              // (coming soon) wire to theme provider
              haptic("light");
            }}
          />
        </View>

        <Text style={styles.note}>
          Sound & Dark Mode toggles are saved now; we’ll hook them up to the app soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 4,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  backTxt: { fontSize: 16, fontWeight: "700", color: "#334155" },

  title: { fontSize: 26, fontWeight: "800" },
  caption: { color: "#64748b", marginTop: 6, marginBottom: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginHorizontal: 4 },
  note: { marginTop: 14, color: "#64748b" },
});
