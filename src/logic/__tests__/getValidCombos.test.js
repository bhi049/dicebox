import { getValidCombos, rollDie } from "../game";

const S = (a) => new Set(a);
const sort2D = (arr) =>
   arr.map(c => [...c].sort((a,b) => a-b))
    .sort((a,b) => a.length - b.length || a[0] - b[0]);

const hasCombo = (list, combo) => {
  const target = [...combo].sort((a,b) => a-b);
  return list.some(c => c.length === target.length && c.every((v, i) => v === target[i]));
};

describe("getValidCombos()", () => {
  test("basic 7 with full board", () => {
    const combos = sort2D(getValidCombos(S([1,2,3,4,5,6,7,8,9,10,11,12]), 7));
    // everything sums to 7
    combos.forEach(c => expect(c.reduce((a,b)=>a+b,0)).toBe(7));
    // canonical options exist
    expect(hasCombo(combos, [7])).toBe(true);
    expect(hasCombo(combos, [1,6])).toBe(true);
    expect(hasCombo(combos, [2,5])).toBe(true);
    expect(hasCombo(combos, [3,4])).toBe(true);
  });

    test("respects unavailable tiles", () => {
    // 3 and 7 are missing → [7] and [3,4] impossible
    const combos = sort2D(getValidCombos(S([1,2,4,5,6,8,9,10,11,12]), 7));
    expect(hasCombo(combos, [7])).toBe(false);
    expect(hasCombo(combos, [3,4])).toBe(false);
    expect(hasCombo(combos, [1,6])).toBe(true);
    expect(hasCombo(combos, [2,5])).toBe(true);
  });

  test("returns unique, valid subsets only", () => {
    const combos = sort2D(getValidCombos(S([1,2,3,4]), 5));
    // Should be exactly [1,4] and [2,3]
    expect(combos.length).toBe(2);
    expect(hasCombo(combos, [1,4])).toBe(true);
    expect(hasCombo(combos, [2,3])).toBe(true);
  });

  test("no combos → empty array", () => {
    const combos = getValidCombos(S([8,9,10,11,12]), 3);
    expect(Array.isArray(combos)).toBe(true);
    expect(combos.length).toBe(0);
  });

  test("larger target sample (12) contains a few expected sets", () => {
    const combos = sort2D(getValidCombos(S([1,2,3,4,5,6,7,8,9,10,11,12]), 12));
    // spot-check a handful
    expect(hasCombo(combos, [12])).toBe(true);
    expect(hasCombo(combos, [5,7])).toBe(true);
    expect(hasCombo(combos, [1,4,7])).toBe(true);
    expect(hasCombo(combos, [2,3,7])).toBe(true);
    expect(hasCombo(combos, [3,4,5])).toBe(true);
  });
});

describe("rollDie()", () => {
  test("always returns 1..6", () => {
    for (let i=0;i<500;i++){
      const v = rollDie();
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});
