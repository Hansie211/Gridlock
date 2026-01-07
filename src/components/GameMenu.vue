<template>
  <q-card class="game-menu q-pa-md column items-start justify-center" flat bordered>
    <q-card-section class="q-pb-sm column">
      <div class="text-h6 text-weight-bold">Level #{{ level }}</div>
      <div class="text-subtitle2 text-grey-7">Difficulty: {{ difficulty }}</div>
    </q-card-section>

    <q-separator spaced />

    <q-card-section class="full-width q-gutter-sm">
      <q-btn label="Settings" icon="settings" align="left" class="full-width" unelevated rounded @click="$emit('settings-click')" />
      <q-btn label="Next Level" icon="play_arrow" align="left" class="full-width" unelevated rounded @click="$emit('next-level-click')" />
      <q-btn label="Retry Level" icon="refresh" align="left" class="full-width" unelevated rounded @click="$emit('retry-level-click')" />
      <q-btn label="Completed Games" icon="check_circle" align="left" class="full-width" unelevated rounded @click="$emit('show-completed-click')" />
    </q-card-section>

    <q-separator spaced />

    <q-card-section class="full-width q-gutter-sm" align="right">
      <q-btn label="Close" unelevated rounded @click="$emit('close')" />
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GameMenu',

  props: {
    level: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: Number,
      required: true,
    },
  },

  emits: ['settings-click', 'next-level-click', 'retry-level-click', 'show-completed-click', 'close'],
});
</script>

<style scoped>
.game-menu {
  min-width: 280px;
  max-width: 360px;
}
</style>
