<template>
  <q-page class="column items-center justify-evenly">
    <div v-if="GameManager.isGenerating" class="loading-overlay column items-center justify-center">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">
        <p>Generating Board...</p>
        <p>Level: {{ GameManager.seed }}</p>
        <p>Difficulty: {{ GameManager.difficulty }}</p>
      </div>
    </div>
    <template v-else>
      <p>Level: {{ GameManager.seed }}, difficulty {{ GameManager.difficulty }}, {{ elapsedTime }}</p>
      <game-board ref="gameBoard" :board="GameManager.board" :solution="GameManager.solution" :selectedCell="GameManager.selectedCellIndex" :user-values="GameManager.userValues" @cell-click="(payload: {idx: number}) => GameManager.setSelectedCell(payload.idx)" />
      <game-keyboard :size="GameManager.board.size" @number-click="onNumberClick" @undo-click="onUndoClick" @menu-click="() => (menuVisible = true)" />

      <q-dialog v-model="menuVisible" persistent>
        <game-menu :level="GameManager.seed" :difficulty="GameManager.difficulty" @close="closeMenu" @retry-level-click="onRetryLevelClick" @new-level-click="onNewLevelClick" />
      </q-dialog>
    </template>
  </q-page>
</template>

<script lang="ts">
import GameBoard from 'src/components/GameBoard.vue';
import GameKeyboard from 'src/components/GameKeyboard.vue';
import GameMenu from 'src/components/GameMenu.vue';
import GameManager from 'src/components/Game';
import DifficultySelectMenu from 'src/components/DifficultySelectMenu.vue';
import { Difficulty } from 'src/components/gamemodels/difficulty';
import { defineComponent } from 'vue';
import { Dialog } from 'quasar';
import { usePreferenceStore } from 'src/stores/preference-store';

export default defineComponent({
  name: 'IndexPage',
  components: { GameBoard, GameKeyboard, GameMenu },

  setup() {
    return { GameManager, preferenceStore: usePreferenceStore() };
  },

  mounted() {
    if (this.preferenceStore.saveGame) {
      this.GameManager.importSaveGame(this.preferenceStore.saveGame);
    } else {
      this.GameManager.generateGame(this.preferenceStore.lastSeed, this.preferenceStore.difficulty);
    }
  },

  unmounted() {
    this.GameManager.clear();
  },

  data() {
    return {
      menuVisible: false,
    };
  },

  methods: {
    onUndoClick() {
      this.GameManager.undoLastMove();
      this.preferenceStore.saveGame = this.GameManager.exportSaveGame();
    },

    onNumberClick(payload: { value: number; notesMode: boolean }) {
      this.GameManager.setUserValue(payload.value);
      this.preferenceStore.saveGame = this.GameManager.exportSaveGame();
    },

    onRetryLevelClick() {
      const gameState = this.GameManager;

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
        gameState.resetLevel();
        this.preferenceStore.saveGame = this.GameManager.exportSaveGame();
        this.closeMenu();
      });
    },

    async onNewLevelClick() {
      const difficulty: Difficulty | null = await new Promise((resolve) => {
        Dialog.create({
          component: DifficultySelectMenu,
          componentProps: {
            initial: this.GameManager.difficulty ?? 1,
          },
          persistent: true,
        }).onOk((val) => resolve(val));
      });

      if (difficulty) {
        this.GameManager.generateGame(this.GameManager.seed + 1, difficulty);
        this.closeMenu();
      }
    },

    closeMenu() {
      this.menuVisible = false;
    },
  },
  watch: {
    'GameManager.isSolved'(newVal, oldVal) {
      if (!oldVal && newVal) {
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
          this.GameManager.generateGame(this.GameManager.seed + 1, this.GameManager.difficulty);
        });
      }
    },
    'GameManager.isGenerating'(newVal, oldVal) {
      if (oldVal && !newVal) {
        this.preferenceStore.lastSeed = this.GameManager.seed;
        this.preferenceStore.difficulty = this.GameManager.difficulty;
        this.preferenceStore.saveGame = this.GameManager.exportSaveGame();
      }
    },
  },

  computed: {
    elapsedTime(): string {
      if (this.GameManager.elapsedSeconds <= 0) return '00:00';

      const minutes = Math.floor(this.GameManager.elapsedSeconds / 60);
      const seconds = this.GameManager.elapsedSeconds % 60;

      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');

      return `${mm}:${ss}`;
    },
  },
});
</script>
