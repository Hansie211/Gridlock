<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-pa-md column items-center justify-center" style="width: 400px">
      <q-card-section class="text-center q-pb-sm">
        <div class="text-h6 text-weight-bold">Select Difficulty</div>
      </q-card-section>

      <q-separator spaced />

      <q-card-section class="full-width q-gutter-sm">
        <div class="column justify-around">
          <div v-for="opt in options" :key="opt.value" class="row items-center justify-start difficulty-option q-pa-xs q-gutter-x-md" :class="{ highlighted: opt.value === initial }" @click="onOKClick(opt.value)">
            <span>{{ opt.label }}</span>
            <span class="row justify-center q-mb-xs">
              <span v-for="n in opt.stars" :key="n" class="star" :style="{ color: opt.color, fontSize: '1.5em' }">★</span>
            </span>
          </div>
        </div>
      </q-card-section>

      <q-separator spaced />

      <q-card-section class="full-width q-gutter-sm">
        <q-btn label="Cancel" color="negative" flat rounded class="full-width" @click="onCancelClick" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Difficulty } from './gamemodels/difficulty';
import { useDialogPluginComponent } from 'quasar';

interface DifficultyOption {
  value: Difficulty;
  label: string;
  color: string;
  stars: number;
}

export default defineComponent({
  name: 'DifficultySelectMenu',

  props: {
    initial: {
      type: Number as () => Difficulty,
      default: 1,
    },
  },

  emits: ['ok', 'hide'],

  setup() {
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

    const onOKClick = (value: Difficulty) => {
      onDialogOK(value);
    };

    const onCancelClick = () => {
      onDialogCancel();
    };

    return { dialogRef, onDialogHide, onOKClick, onCancelClick };
  },

  computed: {
    options() {
      return [
        { value: 1, label: 'Very Easy', color: 'yellow', stars: 1 },
        { value: 2, label: 'Very Easy', color: 'yellow', stars: 2 },
        { value: 3, label: 'Very Easy', color: 'yellow', stars: 3 },
        { value: 4, label: 'Easy', color: 'blue', stars: 1 },
        { value: 5, label: 'Easy', color: 'blue', stars: 2 },
        { value: 6, label: 'Easy', color: 'blue', stars: 3 },
        { value: 7, label: 'Hard', color: 'red', stars: 1 },
        { value: 8, label: 'Hard', color: 'red', stars: 2 },
        { value: 9, label: 'Hard', color: 'red', stars: 3 },
      ] as DifficultyOption[];
    },
  },
});
</script>

<style scoped>
.difficulty-option {
  cursor: pointer;
  text-align: center;
  border-radius: 8px;
  padding: 8px;
  transition: transform 0.15s, box-shadow 0.15s;
}

.difficulty-option.highlighted {
  transform: scale(1.05);
  border: 2px solid var(--q-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.difficulty-option:hover {
  transform: scale(1.02);
}
</style>
