<template>
  <div class="cell" :class="{ 'row-start': isRowStart, 'row-end': isRowEnd, 'col-start': isColStart, 'col-end': isColEnd, constant: isConstant, selected: isSelected, wrong: isWrong }" @click="$emit('click')">
    {{ displayValue }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GameCell',

  emits: ['click'],

  props: {
    originalValue: {
      type: Number,
      required: true,
    },
    userValue: {
      type: Number,
      required: true,
    },

    isWrong: {
      type: Boolean,
      default: true,
    },

    isSelected: {
      type: Boolean,
      default: false,
    },

    isRowStart: {
      type: Boolean,
      default: false,
    },
    isRowEnd: {
      type: Boolean,
      default: false,
    },
    isColStart: {
      type: Boolean,
      default: false,
    },
    isColEnd: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    isConstant(): boolean {
      return this.originalValue !== 0;
    },

    displayValue(): string {
      const value = this.originalValue > 0 ? this.originalValue : this.userValue;
      return value > 0 ? value.toString() : '';
    },
  },
});
</script>

<style scoped>
.cell {
  --cell-size: 40px;
  width: var(--cell-size);
  height: var(--cell-size);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  font-weight: bold;
  user-select: none;
}

.col-start {
  border-top: 1px solid black;
}

.col-end {
  border-bottom: 1px solid black;
}

.row-start {
  border-left: 1px solid black;
}

.row-end {
  border-right: 1px solid black;
}

.col-start.col-end.row-start.row-end {
  background-color: black;
}

.wrong::before,
.wrong::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 1px;
  background-color: rgba(255, 0, 0, 0.4);
}

.wrong::before {
  transform: translate(-50%, -50%) rotate(45deg);
  transform-origin: center;
}

.wrong::after {
  transform: translate(-50%, -50%) rotate(-45deg);
  transform-origin: center;
}

.constant {
  background-color: #ffe;
}

.selected {
  background-color: #999;
}
</style>
