<template>
  <div class="flex w-full  h-full justify-center items-center">
    <TransitionRoot
      :show="showing"
      enter="transform transition duration-[400ms]"
      enter-from="scale-50"
      enter-to="scale-100"
      leave="transform duration-500 transition ease-in-out"
      leave-from="scale-100"
      leave-to="opacity-0 scale-95"
    >
      <div
        class="item drop-shadow-lg rounded-lg p-10 bg-orange-50"
        @click="next"
      >
        {{ item.name }}
      </div>
    </TransitionRoot>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import { TransitionRoot } from "@headlessui/vue";

export interface Item {
  name: string;
  title: string;
}

export default defineComponent({
  props: {
    items: {
      type: Array as PropType<Item[]>,
    },
  },
  components: {
    TransitionRoot,
  },
  data: () => ({
    showing: false,
    idx: 0
  }),
  computed: {
    item(): Item | null {
      return this.items?.length ? this.items[this.idx] : null;
    }
  },
  watch: {
    item() {
      this.showing = this.item !== null;
    }
  },
  methods: {
    next() {
      this.showing = false;
      setTimeout(() => {
        this.idx += 1;
        if(this.idx >= this.items!.length) {
          this.idx = 0;
        }
      }, 500);
    }
  }
});
</script>


<style>
.item {
  cursor: pointer;
  user-select: none;
}
</style>