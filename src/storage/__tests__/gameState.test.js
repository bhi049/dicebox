// src/storage/__tests__/gameState.test.js
import { saveGameState, loadGameState, clearGameState } from "../gameState";

// Mock AsyncStorage (simple in-memory store)
jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      setItem: async (k, v) => { store.set(k, v); },
      getItem: async (k) => store.get(k) ?? null,
      removeItem: async (k) => { store.delete(k); },
      // expose for tests if ever needed:
      __store: store,
    },
  };
});

// Static import of the mocked module (no dynamic import!)
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = {
  available: new Set([1, 2, 3, 10, 12]),
  selected: new Set([2, 3]),
  dice: [3, 4],
  phase: "rolled",
  skipsRemaining: 4,
  rollCount: 7,
  diceMode: 2,
};

test("save -> load restores Sets and fields", async () => {
  await saveGameState(BASE);
  const loaded = await loadGameState();

  expect(loaded.phase).toBe("rolled");
  expect(loaded.dice).toEqual([3, 4]);
  expect(loaded.skipsRemaining).toBe(4);
  expect(loaded.rollCount).toBe(7);
  expect(loaded.diceMode).toBe(2);

  expect(Array.from(loaded.available).sort((a,b)=>a-b)).toEqual([1,2,3,10,12]);
  expect(Array.from(loaded.selected).sort((a,b)=>a-b)).toEqual([2,3]);
});

test("clearGameState removes saved game", async () => {
  await clearGameState();
  const loaded = await loadGameState();
  expect(loaded).toBeNull();
});

test("invalid payloads are ignored safely", async () => {
  // write corrupted data directly into mocked storage
  await AsyncStorage.setItem("dicebox.v1.game", JSON.stringify({ phase: "nope" }));
  const loaded = await loadGameState();
  expect(loaded).toBeNull();
});
