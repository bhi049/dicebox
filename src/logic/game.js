export function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

// Return all unique combos from availableSet that sum to target
export function getValidCombos(availableSet, target) {
  const nums = Array.from(availableSet).sort((a, b) => a - b);
  const out = [];
  (function backtrack(start, remain, path) {
    if (remain === 0) return out.push([...path]);
    for (let i = start; i < nums.length; i++) {
      const n = nums[i];
      if (n > remain) break;
      path.push(n);
      backtrack(i + 1, remain - n, path);
      path.pop();
    }
  })(0, target, []);
  return out;
}
