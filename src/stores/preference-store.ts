import { defineStore } from 'pinia';
import { SaveGame } from 'src/components/Game';

export const usePreferenceStore = defineStore('preference-store', {
  state: () => ({
    saveGame: undefined as SaveGame | undefined,
  }),
  persist: true,
});
