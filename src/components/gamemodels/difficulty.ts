export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export const LOW: Difficulty = 1;
export const HIGH: Difficulty = 9;

export function percentageHelp(difficulty: Difficulty) {
  const minimalEmpty = 70; // at diff 1, at max X% of cells is empty
  const maximalEmpty = 95; // at diff 9, at max X% of cells is empty
  return 100 - (minimalEmpty + ((difficulty - LOW) / (HIGH - LOW)) * (maximalEmpty - minimalEmpty));
}

export function getSize(difficulty: Difficulty): number {
  const minSize = 5;
  const maxSize = 9;

  const size = minSize + Math.floor(((difficulty - LOW) / (HIGH - LOW)) * (maxSize - minSize + 1));
  return Math.min(size, maxSize);
}

export function getDifficulty(level: number): Difficulty {
  const diff = Math.min(LOW + Math.floor((level - 1) / 5), HIGH);
  return diff as Difficulty;
}
