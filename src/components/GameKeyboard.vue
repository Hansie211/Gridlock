<template>
  <div class="game-keyboard column items-center justify-center q-pa-xs q-gutter-y-sm">
    <div class="row no-wrap q-gutter-xs justify-center">
      <q-btn v-for="n in size" :key="n" :label="n" @click="onNumberClick(n)" flat dense class="number-btn" />
    </div>

    <div class="q-gutter-x-sm justify-center q-ml-sm">
      <q-btn icon="close" @click="onNumberClick(0)" flat dense class="action-btn" />
      <q-btn icon="undo" flat dense @click="$emit('undo-click')" class="action-btn" />
      <q-btn icon="menu" flat dense @click="$emit('menu-click')" class="action-btn" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GameKeyboard',
  props: {
    size: { type: Number, required: true },
  },
  emits: ['number-click', 'undo-click', 'menu-click'],
  setup(props, { emit }) {
    const onNumberClick = (n: number) => {
      emit('number-click', { value: n, notesMode: false });
    };
    return { onNumberClick };
  },
});
</script>

<style scoped>
.game-keyboard {
  width: 100%;
  padding: 4px 0;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.number-btn {
  width: 40px;
  min-width: 40px;
  height: 40px;
  font-size: 1rem;
  background-color: #e0e0e0;
  color: #222;
}

.action-btn {
  width: 36px;
  height: 36px;
  color: #555;
}
</style>
