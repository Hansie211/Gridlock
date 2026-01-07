import { Difficulty, getSize } from './difficulty';
import createRNG, { RNG } from './RNG';
import Solution, { generateSolution } from './solution';

export default interface Board {
  readonly size: number;
  readonly cellcount: number;
  readonly rows: number[][];
  readonly columns: number[][];
}

class BoardImpl {
  readonly cellcount: number;
  readonly rows: number[][];
  readonly columns: number[][];

  constructor(public size: number, rng: RNG) {
    if (size < 5) {
      throw new Error(`Size ${size} is too small`);
    }
    this.cellcount = this.size * this.size;

    // setup the dividers
    const indices = Array.from({ length: this.size }, (_, i) => i);

    // 'fullSegments' -> the amount of rows/cols that should consist of one single, full, segment
    const fullSegments = Math.max(Math.floor(this.size / 2 - 1) - rng.getNext(1), 2);
    const fullRows = rng.shuffle([...indices]).slice(0, fullSegments);
    const fullCols = rng.shuffle([...indices]).slice(0, fullSegments);

    const rowSegments: (number[] | undefined)[] = Array.from({ length: this.size }, () => undefined);
    for (const r of fullRows) rowSegments[r] = [this.size];

    const colSegments: (number[] | undefined)[] = Array.from({ length: this.size }, () => undefined);
    for (const c of fullCols) colSegments[c] = [this.size];

    const success = placeDividers(rowSegments, colSegments, rng);
    if (!success) {
      throw new Error('Unsolvable div board');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.rows = rowSegments.map((seg) => seg!.map((size) => size));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.columns = colSegments.map((seg) => seg!.map((size) => size));
  }
}

function buildSegmentMaps(rowSegments: number[][], colSegments: number[][]) {
  const size = rowSegments.length;
  const rowMap: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const colMap: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  const getSegmentIndex = (segmentSizes: number[], value: number): number => {
    let cursor = 0;
    for (let i = 0; i < segmentSizes.length; i++) {
      const size = segmentSizes[i];

      if (cursor <= value && cursor + size > value) {
        return i;
      }

      cursor += size;
    }

    throw Error(`Unable to find value ${value} in ${segmentSizes}`);
  };

  // Fill rowMap from rowSegments
  for (let rowIndex = 0; rowIndex < size; rowIndex++) {
    for (let cell = 0; cell < size; cell++) {
      const colIndex = cell;
      const segmentIndex = getSegmentIndex(colSegments[colIndex], rowIndex);

      rowMap[rowIndex][cell] = colSegments[colIndex][segmentIndex];
    }
  }

  // Fill rowMap from colSegments
  for (let colIndex = 0; colIndex < size; colIndex++) {
    for (let cell = 0; cell < size; cell++) {
      const rowIndex = cell;
      const segmentIndex = getSegmentIndex(rowSegments[rowIndex], colIndex);

      colMap[colIndex][cell] = rowSegments[rowIndex][segmentIndex];
    }
  }

  return { rowMap, colMap };
}

function isValidBoard(rowSegments: number[][], colSegments: number[][]): boolean {
  const size = rowSegments.length;
  const { rowMap, colMap } = buildSegmentMaps(rowSegments, colSegments);

  // Check rows
  for (let rowIndex = 0; rowIndex < size; rowIndex++) {
    let cursor = 0;

    for (const segmentSize of rowSegments[rowIndex]) {
      const colSegmentSizes = rowMap[rowIndex].slice(cursor, cursor + segmentSize).sort((a, b) => b - a);

      for (let i = 0; i < segmentSize; i++) {
        const required = segmentSize - i;
        if (colSegmentSizes[i] < required) return false;
      }

      cursor += segmentSize;
    }
  }

  // Check cols
  for (let colIndex = 0; colIndex < size; colIndex++) {
    let cursor = 0;

    for (const segmentSize of colSegments[colIndex]) {
      const rowSegmentSizes = colMap[colIndex].slice(cursor, cursor + segmentSize).sort((a, b) => b - a);

      for (let i = 0; i < segmentSize; i++) {
        const required = segmentSize - i;
        if (rowSegmentSizes[i] < required) return false;
      }

      cursor += segmentSize;
    }
  }

  return true;
}

function placeDividers(rowSegments: (number[] | undefined)[], colSegments: (number[] | undefined)[], rng: RNG): boolean {
  const size = rowSegments.length;
  const rowIndex = rowSegments.findIndex((r) => r === undefined);
  const colIndex = rowIndex === -1 ? colSegments.findIndex((c) => c === undefined) : -1;

  if (rowIndex === -1 && colIndex === -1) {
    return true;
  }

  const structure = {
    get() {
      return rowIndex !== -1 ? rowSegments[rowIndex] : colSegments[colIndex];
    },
    set(segment: number[] | undefined) {
      if (rowIndex !== -1) {
        rowSegments[rowIndex] = segment;
      } else {
        colSegments[colIndex] = segment;
      }
    },
    reset() {
      this.set(undefined);
    },
  };

  const twoPartSplits = rng.shuffle(
    Array.from({ length: size - 1 }, (_, i) => {
      return [i + 1, size - (i + 1)];
    })
  );

  for (const split of twoPartSplits) {
    structure.set(split);

    if (
      !isValidBoard(
        [...rowSegments].map((x) => (x === undefined ? [size] : x)),
        [...colSegments].map((x) => (x === undefined ? [size] : x))
      )
    ) {
      continue;
    }

    if (placeDividers(rowSegments, colSegments, rng)) {
      return true;
    }
  }

  structure.reset();
  return false;
}

export function generateBoard(difficulty: Difficulty, rng: RNG): [Board, Solution] {
  const size = getSize(difficulty);

  while (true) {
    const seed = rng.getNext(Number.MAX_SAFE_INTEGER);
    const seededRNG = createRNG(seed);

    const board = new BoardImpl(size, seededRNG);
    let solution: Solution | undefined = undefined;
    try {
      solution = generateSolution(board, difficulty, seededRNG);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'Unsolvable board') {
        // ignore
      } else {
        throw e;
      }
    }

    if (solution) return [board, solution];
  }
}
