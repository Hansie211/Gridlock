<template>
  <div class="flex column">
    <span>{{ isSolved ? 'Solved ✅' : ' ' }}</span>
    <div class="game-board">
      <div v-for="rowIndex in board.size" :key="rowIndex" class="board-row">
        <game-cell v-for="colIndex in board.size" :key="colIndex" :originalValue="getSkeletonValue(colIndex, rowIndex)" :userValue="getUserValue(colIndex, rowIndex)" v-bind="getCellSegmentFlags(colIndex, rowIndex)" @click="() => onClickCell(colIndex, rowIndex)" :isSelected="colIndex === selectedCellCol && rowIndex === selectedCellRow" :isWrong="getIsWrong(colIndex, rowIndex)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Board from 'src/components/gamemodels/board';
import { defineComponent, ref } from 'vue';
import GameCell from 'src/components/GameCell.vue';
import Solution from './gamemodels/solution';
import { PropType } from 'vue';

export default defineComponent({
  name: 'GameBoard',
  components: { GameCell },

  emits: ['solved'],

  props: {
    board: {
      type: Object as PropType<Board>,
      required: true,
    },
    solution: {
      type: Object as PropType<Solution>,
      required: true,
    },
  },

  setup(props) {
    const userValues = ref([...props.solution.skeleton]);
    const userNotes = ref(Array.from({ length: props.board.cellcount }, () => [] as number[]));
    const userMoveMemories: MoveMemory[] = [];

    return { userValues, userNotes, userMoveMemories };
  },

  mounted() {
    this.resetLevel();
  },

  data() {
    return {
      selectedCellIndex: undefined as undefined | number,
    };
  },

  computed: {
    selectedCellRow(): number | undefined {
      if (this.selectedCellIndex === undefined) return undefined;
      return Math.floor(this.selectedCellIndex / this.board.size) + 1;
    },

    selectedCellCol(): number | undefined {
      if (this.selectedCellIndex === undefined) return undefined;
      return (this.selectedCellIndex % this.board.size) + 1;
    },

    isSolved(): boolean {
      for (let i = 0; i < this.board.cellcount; i++) {
        const correctValue = this.solution.solution[i];
        const userValue = this.userValues[i];

        if (userValue !== correctValue) return false;
      }

      return true;
    },
  },

  methods: {
    getCellIndex(colIndex: number, rowIndex: number): number {
      return (rowIndex - 1) * this.board.size + (colIndex - 1);
    },

    getSkeletonValue(colIndex: number, rowIndex: number): number {
      const cellIndex = this.getCellIndex(colIndex, rowIndex);
      return this.solution.skeleton[cellIndex];
    },

    getUserValue(colIndex: number, rowIndex: number): number {
      const cellIndex = this.getCellIndex(colIndex, rowIndex);
      return this.userValues[cellIndex];
    },

    getIsWrong(colIndex: number, rowIndex: number): boolean {
      const cellIndex = this.getCellIndex(colIndex, rowIndex);

      if (this.solution.skeleton[cellIndex] !== 0) return false;
      if (this.userValues[cellIndex] === 0) return false;

      const userValue = this.userValues[cellIndex];
      const correctValue = this.solution.solution[cellIndex];

      return userValue !== correctValue;
    },

    onClickCell(colIndex: number, rowIndex: number): void {
      if (this.isSolved) return;
      const index = this.getCellIndex(colIndex, rowIndex);
      if (this.solution.skeleton[index] !== 0) {
        this.selectedCellIndex = undefined;
        return; // static item clicked
      }

      if (index === this.selectedCellIndex) {
        this.selectedCellIndex = undefined;
        return;
      }

      this.selectedCellIndex = index;
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setSelectedCellValue(value: number, notesMode: boolean): void {
      if (this.isSolved) return;

      if (this.selectedCellIndex === undefined) return;

      const memory = {
        cellIndex: this.selectedCellIndex,
        oldValue: this.userValues[this.selectedCellIndex],
      };
      this.userMoveMemories.push(memory);

      this.userValues[this.selectedCellIndex] = value !== this.userValues[this.selectedCellIndex] ? value : 0;
    },

    undoLastUserMove() {
      if (this.isSolved) return;
      const lastMove = this.userMoveMemories.pop();
      if (lastMove === undefined) return;

      const index = lastMove.cellIndex;
      const value = lastMove.oldValue;

      this.userValues[index] = value;
      this.selectedCellIndex = undefined;
    },

    resetLevel() {
      this.userValues = this.solution.skeleton.map((v, idx) => {
        const row = Math.floor(idx / this.board.size) + 1;
        const col = (idx % this.board.size) + 1;
        const flags = this.getCellSegmentFlags(col, row);
        const isBoxed = flags.isRowStart && flags.isRowEnd && flags.isColStart && flags.isColEnd;
        if (isBoxed) return 1;

        return v;
      });
      this.userMoveMemories = [];
    },

    getCellSegmentFlags(colIndex: number, rowIndex: number) {
      const rowSegments = this.board.rows[rowIndex - 1];
      const colSegments = this.board.columns[colIndex - 1];

      let rowStart = false;
      let rowEnd = false;
      let colStart = false;
      let colEnd = false;

      // Row segment
      let pos = 0;
      for (const seg of rowSegments) {
        if (colIndex - 1 === pos) rowStart = true;
        pos += seg - 1;
        if (colIndex - 1 === pos) rowEnd = true;
        pos += 1;
      }

      // Column segment
      pos = 0;
      for (const seg of colSegments) {
        if (rowIndex - 1 === pos) colStart = true;
        pos += seg - 1;
        if (rowIndex - 1 === pos) colEnd = true;
        pos += 1;
      }

      return { isRowStart: rowStart, isRowEnd: rowEnd, isColStart: colStart, isColEnd: colEnd };
    },
  },
  watch: {
    isSolved(newVal: boolean, oldVal: boolean) {
      if (newVal && !oldVal) {
        this.$emit('solved');
        this.selectedCellIndex = undefined;
      }
    },
  },
});

interface MoveMemory {
  cellIndex: number;
  oldValue: number;
}
</script>

<style scoped>
.game-board {
  display: inline-block;
  border: 1px solid black;
}

.board-row {
  display: flex;
}
</style>
