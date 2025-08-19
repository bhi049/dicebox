// src/theme/theme.js
import React, { createContext, useContext, useMemo } from "react";
import { StatusBar } from "react-native";
import { THEME_PRESETS } from "../cosmetics/palette";
import { useCosmetics } from "../cosmetics/CosmeticsContext";

const ThemeContext = createContext(THEME_PRESETS.default);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  // Read currently equipped app theme from cosmetics context
  const { equipped } = useCosmetics?.() ?? { equipped: { theme: "default" } };
  const themeId = equipped?.theme || "default";

  const theme = useMemo(() => {
    const base = THEME_PRESETS.default;
    const override = THEME_PRESETS[themeId] || {};
    return { ...base, ...override };
  }, [themeId]);

  const barStyle = theme.mode === "dark" ? "light-content" : "dark-content";

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar barStyle={barStyle} />
      {children}
    </ThemeContext.Provider>
  );
}
