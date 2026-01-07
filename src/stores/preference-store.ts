import { defineStore } from 'pinia';

export const useCounterStore = defineStore('preference-store', {
  state: () => ({
    difficulty: 1,
  }),
  persist: true,
});
