<template>
  <q-page class="column items-center justify-evenly">
    <div v-if="isGenerating" class="loading-overlay column items-center justify-center">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">
        <p>Generating Board...</p>
        <p>Level: {{ seed }}</p>
        <p>Difficulty: {{ difficulty }}</p>
      </div>
    </div>
    <template v-else>
      <p>Level: {{ seed }}, difficulty {{ difficulty }}, {{ elapsedTime }}</p>
      <game-board ref="gameBoard" :board="board!" :solution="solution!" @solved="onSolved" />
      <game-keyboard :size="board!.size" @number-click="onNumberClick" @undo-click="onUndoClick" @menu-click="() => (menuVisible = true)" />
    </template>

    <q-dialog v-model="menuVisible" persistent>
      <game-menu :level="seed" :difficulty="difficulty" @close="closeMenu" @retry-level-click="onRetryLevelClick" @new-level-click="onNewLevelClick" />
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import GameBoard from 'src/components/GameBoard.vue';
import GameKeyboard from 'src/components/GameKeyboard.vue';
import GameMenu from 'src/components/GameMenu.vue';
import DifficultySelectMenu from 'src/components/DifficultySelectMenu.vue';
import Board from 'src/components/gamemodels/board';
import { Difficulty } from 'src/components/gamemodels/difficulty';
import Solution from 'src/components/gamemodels/solution';
import { defineComponent, ref } from 'vue';
import { Dialog } from 'quasar';

export default defineComponent({
  name: 'IndexPage',
  components: { GameBoard, GameKeyboard, GameMenu },

  setup() {
    const gameBoard = ref<InstanceType<typeof GameBoard> | null>(null);

    const isGenerating = ref(true);
    const board = ref<Board | undefined>();
    const solution = ref<Solution | undefined>();

    const elapsedSeconds = ref<number>(0);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let timer: ReturnType<typeof setInterval> = undefined!;
    const resetTimer = () => {
      if (timer) clearInterval(timer);
      elapsedSeconds.value = 0;

      timer = setInterval(() => {
        elapsedSeconds.value += 1;
      }, 1000);
    };

    const clearTimer = () => {
      if (timer) clearInterval(timer);
    };

    const boardGenerationWorker = new Worker(new URL('../components/gamemodels/boardWorker.ts', import.meta.url), { type: 'module' });
    boardGenerationWorker.onmessage = (event: MessageEvent) => {
      const data = event.data as { board?: Board; solution?: Solution; error?: string };
      if (data.error) {
        console.error('Board generation failed:', data.error);
        return;
      }
      board.value = data.board;
      solution.value = data.solution;
      isGenerating.value = false;
      resetTimer();
    };

    return { gameBoard, isGenerating, board, solution, boardGenerationWorker, elapsedSeconds, clearTimer, resetTimer };
  },

  mounted() {
    const seed = getRandomInt(1, 1000);
    const difficulty = getRandomInt(1, 9) as Difficulty;

    this.generateLevel(seed, difficulty);
  },

  unmounted() {
    this.clearTimer();
  },

  data() {
    return {
      seed: 0,
      difficulty: 1 as Difficulty,
      menuVisible: false,
    };
  },

  methods: {
    generateLevel(seed: number, difficulty: Difficulty) {
      this.seed = seed;
      this.difficulty = difficulty;
      this.isGenerating = true;

      this.boardGenerationWorker.postMessage({ seed: this.seed, difficulty: this.difficulty });
    },

    onUndoClick() {
      if (!this.gameBoard) return;

      this.gameBoard.undoLastUserMove();
    },

    onNumberClick(payload: { value: number; notesMode: boolean }) {
      if (!this.gameBoard) return;

      this.gameBoard.setSelectedCellValue(payload.value, payload.notesMode);
    },

    onRetryLevelClick() {
      if (!this.gameBoard) return;

      const gameBoard = this.gameBoard;

      Dialog.create({
        title: 'Retry Level',
        message: 'Are you sure you want to retry this level? Your current progress will be lost.',
        persistent: true,

        ok: {
          label: 'Retry',
          color: 'negative',
          unelevated: true,
        },
        cancel: {
          label: 'Cancel',
          flat: true,
        },
      }).onOk(() => {
        gameBoard.resetLevel();
        this.resetTimer();
        this.closeMenu();
      });
    },

    async onNewLevelClick() {
      const difficulty: Difficulty | null = await new Promise((resolve) => {
        Dialog.create({
          component: DifficultySelectMenu,
          componentProps: {
            initial: this.difficulty ?? 1,
          },
          persistent: true,
        }).onOk((val) => resolve(val));
      });

      if (difficulty) {
        this.generateLevel(getRandomInt(1, 1000), difficulty);
        this.closeMenu();
      }
    },

    closeMenu() {
      this.menuVisible = false;
    },

    onSolved() {
      this.clearTimer();

      Dialog.create({
        title: 'Congratulations!',
        message: `You solved the level in ${this.elapsedTime}!`,
        ok: {
          label: 'Ok',
          color: 'primary',
          unelevated: true,
        },
        persistent: true,
      }).onOk(() => {
        this.generateLevel(this.seed + 1, this.difficulty);
      });
    },
  },

  computed: {
    elapsedTime(): string {
      if (this.elapsedSeconds <= 0) return '00:00';

      const minutes = Math.floor(this.elapsedSeconds / 60);
      const seconds = this.elapsedSeconds % 60;

      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');

      return `${mm}:${ss}`;
    },
  },
});

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(min + (max - min + 1) * Math.random());
}
</script>
