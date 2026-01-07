import Board from './board';
import { Difficulty, percentageHelp } from './difficulty';
import { RNG } from './RNG';

export default interface Solution {
  readonly solution: number[];
  readonly skeleton: number[];
}

class SolutionImpl implements Solution {
  readonly solution: number[];
  readonly skeleton: number[];

  constructor(public readonly board: Board, difficulty: Difficulty, rng: RNG) {
    const boardMap = createBoardMap(board);

    const result = SolutionImpl.solve(
      boardMap,
      Array.from({ length: board.cellcount }, () => 0),
      rng
    );

    if (result === null) {
      throw new Error('Unsolvable board'); // this can happen 🤷‍♂️
    }

    this.solution = result as number[];

    // Now for skeleton, a minimal filled board which still has only one solution. The idea is:
    //  - try to change each cell's value to another value
    //    - if the board then can be solved: cell is required and should be 'static'
    //    - if the board then can't be solved: this cell can be blank

    this.skeleton = [...this.solution];

    const cellOrder = rng.shuffle(Array.from({ length: board.cellcount }, (_, i) => i));
    for (const cellIndex of cellOrder) {
      const cellValue = this.skeleton[cellIndex];

      this.skeleton[cellIndex] = 0;
      const validOptions = getValidOptions(cellIndex, boardMap, this.skeleton).filter((v) => v !== cellValue);
      if (validOptions.length === 0) {
        continue;
      }

      let isRequired = false;

      for (const valueOption of validOptions) {
        this.skeleton[cellIndex] = valueOption;
        if (SolutionImpl.solve(boardMap, [...this.skeleton], rng) !== null) {
          isRequired = true;
          break;
        }
      }

      this.skeleton[cellIndex] = isRequired ? cellValue : 0;
    }

    // Force-fill cells that have borders on all sides
    for (let row = 0; row < board.size; row++) {
      for (let col = 0; col < board.size; col++) {
        const cellIndex = row * board.size + col;

        const rowSegments = board.rows[row];
        const colSegments = board.columns[col];

        let rowStart = false;
        let rowEnd = false;
        let colStart = false;
        let colEnd = false;

        let pos = 0;
        for (const seg of rowSegments) {
          if (col === pos) rowStart = true;
          pos += seg - 1;
          if (col === pos) rowEnd = true;
          pos += 1;
        }

        pos = 0;
        for (const seg of colSegments) {
          if (row === pos) colStart = true;
          pos += seg - 1;
          if (row === pos) colEnd = true;
          pos += 1;
        }

        if (rowStart && rowEnd && colStart && colEnd) {
          this.skeleton[cellIndex] = 1;
        }
      }
    }

    const minimalPercentage = percentageHelp(difficulty);
    const zeroPosMap = rng.shuffle(Array.from({ length: board.cellcount }, (_, i) => new CellRef(i)).filter((r) => r.getValue(this.skeleton) === 0)).map((r) => r.index);

    const expectedFilledCells = Math.floor(board.cellcount * (minimalPercentage / 100));
    const currentFilledCells = board.cellcount - zeroPosMap.length;
    const cellCountToFill = Math.max(0, expectedFilledCells - currentFilledCells);

    const zeroesToFill = zeroPosMap.slice(0, cellCountToFill);
    zeroesToFill.forEach((r) => {
      const value = this.solution[r];
      this.skeleton[r] = value;
    });
  }

  private static undo(values: number[], trail: number[], downToIndex: number) {
    for (let i = trail.length - 1; i >= downToIndex; i--) {
      values[trail[i]] = 0;
    }

    trail.length = downToIndex;
  }

  private static propagate(boardMap: BoardMap, values: number[], trail: number[]): boolean {
    let changed = true;

    while (changed) {
      changed = false;

      for (let i = 0; i < values.length; i++) {
        if (values[i] !== 0) continue;

        const options = getValidOptions(i, boardMap, values);
        if (options.length === 0) return false; // weird
        if (options.length === 1) {
          values[i] = options[0];
          trail.push(i);
          changed = true;
        }
      }
    }

    return true;
  }

  private static solve(boardMap: BoardMap, values: number[], rng: RNG, trail: number[] = []): number[] | null {
    if (!this.propagate(boardMap, values, trail)) return null;

    let bestCell = undefined;
    let bestOptions: number[] | undefined = undefined;

    for (let i = 0; i < values.length; i++) {
      if (values[i] !== 0) continue; // cell already filled
      const options = getValidOptions(i, boardMap, values);

      // dead end
      if (options.length === 0) return null;

      if (bestOptions === undefined || options.length < bestOptions.length) {
        bestCell = i;
        bestOptions = options;

        if (options.length === 1) break;
      }
    }

    if (bestCell === undefined) {
      return values;
    }

    for (const value of bestOptions!) {
      values[bestCell] = value;

      const currentTrailSize = trail.length;
      const result = this.solve(boardMap, values, rng, trail);
      if (result !== null) return result;
      this.undo(values, trail, currentTrailSize);

      values[bestCell] = 0;
    }

    return null;
  }
}

function getValidOptions(cellIndex: number, boardMap: BoardMap, values: number[]): number[] {
  const segmentAvalues: number[] = boardMap[cellIndex].colSegment.map((ref) => ref.getValue(values));
  const segmentBvalues: number[] = boardMap[cellIndex].rowSegment.map((ref) => ref.getValue(values));

  const usedValues = new Set<number>([...segmentAvalues, ...segmentBvalues].filter((v) => v !== 0));

  const max = Math.min(segmentAvalues.length, segmentBvalues.length);

  const options: number[] = [];
  for (let i = 1; i <= max; i++) {
    if (!usedValues.has(i)) {
      options.push(i);
    }
  }

  return options;
}

class CellRef {
  constructor(public readonly index: number) {}

  getValue(values: number[]): number {
    return values[this.index];
  }
}

type BoardMap = {
  [cellIndex: number]: {
    rowSegment: CellRef[];
    colSegment: CellRef[];
  };
};

function createBoardMap(board: Board): BoardMap {
  const map: BoardMap = {};

  const getCellIndex = (row: number, col: number): number => {
    return row * board.size + col;
  };

  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      const cellIndex = getCellIndex(row, col);

      const rowSegment: CellRef[] = [];
      let segmentStart = 0;
      for (const segment of board.rows[row]) {
        const segmentEnd = segmentStart + segment;
        if (col >= segmentStart && col < segmentEnd) {
          for (let i = segmentStart; i < segmentEnd; i++) {
            rowSegment.push(new CellRef(getCellIndex(row, i)));
          }
          break;
        }
        segmentStart = segmentEnd;
      }

      const colSegment: CellRef[] = [];
      segmentStart = 0;
      for (const segment of board.columns[col]) {
        const segmentEnd = segmentStart + segment;
        if (row >= segmentStart && row < segmentEnd) {
          for (let i = segmentStart; i < segmentEnd; i++) {
            colSegment.push(new CellRef(getCellIndex(i, col)));
          }
          break;
        }
        segmentStart = segmentEnd;
      }

      map[cellIndex] = {
        rowSegment,
        colSegment,
      };
    }
  }

  return map;
}

export function generateSolution(board: Board, difficulty: Difficulty, rng: RNG): Solution {
  return new SolutionImpl(board, difficulty, rng);
}
