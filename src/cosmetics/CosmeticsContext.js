import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loadProgression, equipCosmetic as persistEquip } from "../storage/progression";

const defaultEquipped = { diceSkin: null, tileTheme: null, confetti: null, theme: null };
const defaultInventory = { diceSkin: {}, tileTheme: {}, confetti: {}, theme: {} };

const CosmeticsCtx = createContext({
  equipped: defaultEquipped,
  inventory: defaultInventory,
  refresh: () => {},
  equip: async () => {},
});

export function CosmeticsProvider({ children }) {
  const [equipped, setEquipped] = useState(defaultEquipped);
  const [inventory, setInventory] = useState(defaultInventory);

  const refresh = useCallback(async () => {
    const prog = await loadProgression();
    setEquipped(prog.cosmetics?.equipped ?? defaultEquipped);
    setInventory(prog.cosmetics?.inventory ?? defaultInventory);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ✅ Instant UI: optimistic update, then persist
  const equip = useCallback(async (type, idOrNull) => {
    setEquipped(prev => ({ ...prev, [type]: idOrNull ?? null }));
    try { await persistEquip(type, idOrNull); } catch {}
  }, []);

  return (
    <CosmeticsCtx.Provider value={{ equipped, inventory, refresh, equip }}>
      {children}
    </CosmeticsCtx.Provider>
  );
}

export function useCosmetics() {
  return useContext(CosmeticsCtx);
}
