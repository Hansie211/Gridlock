import { defineStore } from 'pinia';
import { SaveGame } from 'src/components/Game';

export const usePreferenceStore = defineStore('preference-store', {
  state: () => ({
    lastLevel: 1,
    saveGame: undefined as SaveGame | undefined,
  }),
  persist: true,
});
