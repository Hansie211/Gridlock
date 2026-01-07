<template>
  <div class="flex column">
    <div class="game-board">
      <div v-for="rowIndex in board.size" :key="rowIndex" class="board-row">
        <game-cell v-for="colIndex in board.size" :key="colIndex" :originalValue="getSkeletonValue(colIndex, rowIndex)" :userValue="getUserValue(colIndex, rowIndex)" v-bind="getCellSegmentFlags(colIndex, rowIndex)" @click="() => onClickCell(colIndex, rowIndex)" :isSelected="colIndex === selectedCellCol && rowIndex === selectedCellRow" :isWrong="getIsWrong(colIndex, rowIndex)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Board from 'src/components/gamemodels/board';
import { defineComponent } from 'vue';
import GameCell from 'src/components/GameCell.vue';
import Solution from './gamemodels/solution';
import { PropType } from 'vue';

export default defineComponent({
  name: 'GameBoard',
  components: { GameCell },

  emits: ['cell-click'],

  props: {
    board: {
      type: Object as PropType<Board>,
      required: true,
    },
    solution: {
      type: Object as PropType<Solution>,
      required: true,
    },
    userValues: {
      type: Object as PropType<number[]>,
      required: true,
    },
    selectedCell: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
  },

  computed: {
    selectedCellRow(): number | undefined {
      if (this.selectedCell === undefined) return undefined;
      return Math.floor(this.selectedCell / this.board.size) + 1;
    },

    selectedCellCol(): number | undefined {
      if (this.selectedCell === undefined) return undefined;
      return (this.selectedCell % this.board.size) + 1;
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
      this.$emit('cell-click', { idx: this.getCellIndex(colIndex, rowIndex) });
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
});
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
