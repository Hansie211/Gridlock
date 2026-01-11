import { reactive, watch } from 'vue';
import Board from './gamemodels/board';
import Solution from './gamemodels/solution';
import { Difficulty, getDifficulty } from './gamemodels/difficulty';

export interface MoveMemory {
  cellIndex: number;
  oldValue: number;
}

export interface SaveGame {
  readonly board: Board;
  readonly solution: Solution;
  readonly userData: { values: number[]; moves: MoveMemory[] };
  readonly level: number;
  readonly elapsedSeconds: number;
}

let timer: ReturnType<typeof setInterval> | undefined;

const GameManager = reactive({
  board: undefined as unknown as Board,
  solution: undefined as unknown as Solution,
  userValues: [] as number[],
  moveMemories: [] as MoveMemory[],
  isGenerating: true,
  elapsedSeconds: 0,
  selectedCellIndex: undefined as number | undefined,
  level: 0,
  difficulty: 1 as Difficulty,
  isSolved: false,

  setSelectedCell(index: number | undefined) {
    this.selectedCellIndex = index;
  },

  setUserValue(value: number) {
    if (this.isSolved) return;
    if (this.selectedCellIndex === undefined) return;
    if (this.solution.skeleton[this.selectedCellIndex] !== 0) return;

    this.moveMemories.push({
      cellIndex: this.selectedCellIndex,
      oldValue: this.userValues[this.selectedCellIndex],
    });

    if (this.userValues[this.selectedCellIndex] === value) {
      this.userValues[this.selectedCellIndex] = 0;
      return;
    }

    this.userValues[this.selectedCellIndex] = value;

    // solved?
    for (let i = 0; i < this.board.cellcount; i++) {
      const correctValue = this.solution.solution[i];
      const userValue = this.userValues[i];
      if (userValue !== correctValue) {
        return;
      }
    }

    this.isSolved = true;
  },

  undoLastMove() {
    if (this.isSolved) return;
    const lastMove = this.moveMemories.pop();
    if (!lastMove) return;

    this.userValues[lastMove.cellIndex] = lastMove.oldValue;
    this.selectedCellIndex = undefined;
  },

  resetLevel() {
    if (!this.solution) return;

    this.userValues.length = this.solution.skeleton.length;
    this.solution.skeleton.forEach((v, i) => (this.userValues[i] = v));
    this.moveMemories.length = 0;
    this.selectedCellIndex = undefined;

    this.isSolved = false;
    this.resetTimer();
  },

  resetTimer(seconds?: number) {
    if (timer) clearInterval(timer);
    this.elapsedSeconds = seconds ?? 0;
    timer = setInterval(() => {
      this.elapsedSeconds += 1;
    }, 1000);
  },

  stopTimer() {
    if (timer) clearInterval(timer);
    timer = undefined;
  },

  generateGame(level: number) {
    this.level = level;
    this.difficulty = getDifficulty(level);
    this.isGenerating = true;
    this.selectedCellIndex = undefined;

    boardGenerationWorker.postMessage({ level: this.level, difficulty: this.difficulty });
  },

  importSaveGame(game: SaveGame) {
    this.board = game.board;
    this.solution = game.solution;
    this.level = game.level;
    this.difficulty = getDifficulty(this.level);

    this.userValues.length = game.userData.values.length;
    game.userData.values.forEach((v, i) => (this.userValues[i] = v));

    this.moveMemories.length = game.userData.moves.length;
    game.userData.moves.forEach((v, i) => (this.moveMemories[i] = v));

    this.selectedCellIndex = undefined;

    this.isSolved = false;
    this.isGenerating = false;
    this.resetTimer(game.elapsedSeconds);
  },

  exportSaveGame(): SaveGame {
    return {
      board: this.board,
      solution: this.solution,
      userData: { values: [...this.userValues], moves: [...this.moveMemories] },
      level: this.level,
      elapsedSeconds: this.elapsedSeconds,
    };
  },

  clear() {
    this.stopTimer();
    boardGenerationWorker.terminate();
  },
});

const boardGenerationWorker = new Worker(new URL('./gamemodels/boardWorker.ts', import.meta.url), { type: 'module' });
boardGenerationWorker.onmessage = (event: MessageEvent) => {
  const data = event.data as { board?: Board; solution?: Solution; error?: string };
  if (data.error || !data.board || !data.solution) {
    console.error('Board generation failed:', data.error);
    return;
  }

  GameManager.board = data.board;
  GameManager.solution = data.solution;
  GameManager.isGenerating = false;
  GameManager.resetLevel();
};

watch(
  () => GameManager.isSolved,
  (solved) => {
    if (!solved) return;
    GameManager.stopTimer();
  }
);

export function isSaveGameValid(game: unknown): game is SaveGame {
  function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  function isPositiveInt(value: unknown): value is number {
    return Number.isSafeInteger(value) && (value as number) >= 0;
  }

  function isBoard(board: unknown): board is Board {
    if (!isObject(board)) return false;

    if (!isPositiveInt(board.size)) return false;
    if (!isPositiveInt(board.cellcount)) return false;

    if (!Array.isArray(board.rows)) return false;
    if (!board.rows.every((row) => Array.isArray(row) && row.every(isPositiveInt))) return false;

    if (!Array.isArray(board.columns)) return false;
    if (!board.columns.every((col) => Array.isArray(col) && col.every(isPositiveInt))) return false;

    return true;
  }

  function isSolution(solution: unknown): solution is Solution {
    if (!isObject(solution)) return false;

    if (!Array.isArray(solution.solution)) return false;
    if (!solution.solution.every(isPositiveInt)) return false;

    if (!Array.isArray(solution.skeleton)) return false;
    if (!solution.skeleton.every(isPositiveInt)) return false;

    return true;
  }

  function isUserData(userData: unknown): userData is SaveGame['userData'] {
    if (!isObject(userData)) return false;

    if (!Array.isArray(userData.values)) return false;
    if (!userData.values.every(isPositiveInt)) return false;

    if (!Array.isArray(userData.moves)) return false;
    if (!userData.moves.every(isMoveMemory)) return false;

    return true;
  }

  function isMoveMemory(move: unknown): move is MoveMemory {
    if (!isObject(move)) return false;

    if (!isPositiveInt(move.cellIndex)) return false;
    if (!isPositiveInt(move.oldValue)) return false;

    return true;
  }

  if (!isObject(game)) return false;

  if (!isPositiveInt(game.level)) return false;
  if (!isPositiveInt(game.elapsedSeconds)) return false;

  if (!isBoard(game.board)) return false;
  if (!isSolution(game.solution)) return false;
  if (!isUserData(game.userData)) return false;

  return true;
}

export default GameManager;
