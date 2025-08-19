import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/screens/HomeScreen";
import GameScreen from "./src/screens/GameScreen";
import StatsScreen from "./src/screens/StatsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AchievementsScreen from "./src/screens/AchievementsScreen";

import { ThemeProvider } from "./src/theme/theme";
import { CosmeticsProvider } from "./src/cosmetics/CosmeticsContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <CosmeticsProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </CosmeticsProvider>
  );
}
