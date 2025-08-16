import React, { createContext, useContext } from "react";
import { StatusBar } from "react-native";

const theme = {
  bg: "#f7f8fb",
  card: "#ffffff",
  text: "#0f172a",
  subtext: "#475569",
  primary: "#4f46e5",
  border: "#e5e7eb",
  tile: "#eef2ff",
  tileClosed: "#e2e8f0",
  diceBg: "#ffffff",
  radius: 14,
};

const ThemeContext = createContext(theme);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar barStyle="dark-content" />
      {children}
    </ThemeContext.Provider>
  );
}
