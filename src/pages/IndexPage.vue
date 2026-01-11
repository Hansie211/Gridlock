<template>
  <q-page class="column items-center justify-evenly">
    <div v-if="GameManager.isGenerating" class="loading-overlay column items-center justify-center">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">
        <p>Generating Board...</p>
        <p>Level: {{ GameManager.level }}</p>
        <p>Difficulty: {{ GameManager.difficulty }}</p>
      </div>
    </div>
    <template v-else>
      <q-chip color="primary" text-color="white" icon="military_tech"> Level {{ GameManager.level }} </q-chip>

      <game-board :board="GameManager.board" :solution="GameManager.solution" :selectedCell="GameManager.selectedCellIndex" :user-values="GameManager.userValues" @cell-click="(payload: {idx: number}) => GameManager.setSelectedCell(payload.idx)" />

      <p>
        <q-chip :color="getDifficultyChipColor(GameManager.difficulty)" text-color="black" icon="stars">
          <q-icon v-for="i in ((GameManager.difficulty - 1) % 3) + 1" :key="i" name="star" size="18px" class="q-ml-xs" />
        </q-chip>

        <q-chip color="secondary" text-color="white" icon="schedule">
          {{ elapsedTime }}
        </q-chip>
      </p>

      <game-keyboard :size="GameManager.board.size" @number-click="onNumberClick" @undo-click="onUndoClick" @menu-click="() => (menuVisible = true)" />

      <q-dialog v-model="menuVisible" persistent>
        <game-menu :level="GameManager.level" :difficulty="GameManager.difficulty" @close="closeMenu" @retry-level-click="onRetryLevelClick" @next-level-click="onNextLevelClick" />
      </q-dialog>
    </template>
  </q-page>
</template>

<script lang="ts">
import GameBoard from 'src/components/GameBoard.vue';
import GameKeyboard from 'src/components/GameKeyboard.vue';
import GameMenu from 'src/components/GameMenu.vue';
import GameManager, { isSaveGameValid } from 'src/components/Game';
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
    if (!isSaveGameValid(this.preferenceStore.saveGame)) {
      this.GameManager.generateGame(1);
      return;
    }

    this.GameManager.importSaveGame(this.preferenceStore.saveGame);
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

    onNextLevelClick() {
      Dialog.create({
        title: 'Next Level',
        message: 'Are you ready to start the next level?',
        persistent: true,
        ok: true,
        cancel: true,
      }).onOk(() => {
        this.GameManager.generateGame(this.GameManager.level + 1);
        this.closeMenu();
      });
    },

    closeMenu() {
      this.menuVisible = false;
    },

    getDifficultyChipColor(difficulty: number): string {
      if (difficulty <= 3) return 'amber';
      if (difficulty <= 6) return 'blue';
      return 'red';
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
          this.GameManager.generateGame(this.GameManager.level + 1);
        });
      }
    },
    'GameManager.isGenerating'(newVal, oldVal) {
      if (oldVal && !newVal) {
        this.preferenceStore.saveGame = this.GameManager.exportSaveGame();
      }
    },
    'GameManager.elapsedSeconds'() {
      this.preferenceStore.saveGame = this.GameManager.exportSaveGame();
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

<style scoped>
.level-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-family: 'Arial', sans-serif;
  font-size: 1.2rem;
}

.level-text {
  font-weight: bold;
}

.elapsed-time {
  font-style: italic;
  color: #555;
}
</style>
