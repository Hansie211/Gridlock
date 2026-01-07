import { defineStore } from 'pinia';
import { SaveGame } from 'src/components/Game';
import { Difficulty } from 'src/components/gamemodels/difficulty';

export const usePreferenceStore = defineStore('preference-store', {
  state: () => ({
    difficulty: 1 as Difficulty,
    lastSeed: 1,
    saveGame: undefined as SaveGame | undefined,
  }),
  persist: true,
});
