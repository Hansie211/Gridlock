import Board, { generateBoard } from './board';
import { Difficulty } from './difficulty';
import createRNG, { RNG } from './RNG';
import Solution from './solution';

interface WorkerMessage {
  seed: number;
  difficulty: Difficulty;
}

interface WorkerResponse {
  board?: Board;
  solution?: Solution;
  error?: string;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { seed, difficulty } = event.data;
  const rng: RNG = createRNG(seed);

  try {
    const [board, solution] = generateBoard(difficulty, rng);
    const response: WorkerResponse = { board, solution };
    self.postMessage(response);
  } catch (e) {
    const response: WorkerResponse = { error: (e as Error).message };
    self.postMessage(response);
  }
};
