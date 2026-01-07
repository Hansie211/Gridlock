export abstract class RNG {
  constructor(protected readonly seed: number) {}

  protected abstract next(lower: number, upper: number): number;

  getNext(upper: number): number;
  getNext(lower: number, upper: number): number;
  getNext(a: number, b?: number): number {
    if (b === undefined) {
      return this.next(0, a);
    }
    return this.next(a, b);
  }

  pick<T>(arr: T[]): T {
    return arr[this.getNext(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.getNext(0, i); 
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

class DefaultRNG extends RNG {
  private index: number;

  constructor(seed: number) {
    super(seed);
    this.index = seed;
  }

  next(lower: number, upper: number): number {
    if (upper <= lower) {
      return lower;
    }

    this.index = (this.index * 1664525 + 1013904223) >>> 0;

    const range = upper - lower + 1;
    return lower + (this.index % range);
  }
}

export default function createRNG(seed: number): RNG {
  return new DefaultRNG(seed);
}
