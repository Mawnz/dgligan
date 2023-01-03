<template>
  <div class="h-full container flex-col">
    <section id="overview"></section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

interface Hole {
  number: number;
  par: number;
}

interface Score {
  hole: number;
  par: number;
  score: number;
  player: string;
}

interface Competition {
  name: string;
  holes: { [key: number]: Hole };
  scores: { [key: string]: Score[] };
  date?: string;
}

export default defineComponent({
  data() {
    return {
      comps: {} as { [key: string]: Competition },
    };
  },
  async created() {
    const raw = await useFetch(
      "https://docs.google.com/spreadsheets/d/1U8vlST4Y66HoIdv2KtQHh_GagpLVheFBsQRQ_uCP7Nk/gviz/tq?tqx=out:csv&sheet=raw"
    );

    const meta = await useFetch(
      "https://docs.google.com/spreadsheets/d/1U8vlST4Y66HoIdv2KtQHh_GagpLVheFBsQRQ_uCP7Nk/gviz/tq?tqx=out:csv&sheet=meta"
    );

    let i = 0;

    for (let row of (meta.data.value as string).split("\n")) {
      if (i === 0) {
        i += 1;
      } else {
        const [name, date] = row.replaceAll('"', "").split(",");

        if (!this.comps[name]) {
          this.comps[name] = {
            name,
            holes: {},
            scores: {},
            date,
          };
        }
      }
    }

    i = 0;

    for (let row of (raw.data.value as string).split("\n")) {
      if (i === 0) {
        i += 1;
      } else {
        const [player, comp, h, hp, s] = row.replaceAll('"', "").split(",");
        const hole = parseInt(h);
        const holepar = parseInt(hp);
        const score = parseInt(s);

        if (!this.comps[comp]) {
          this.comps[comp] = {
            name: comp,
            holes: {},
            scores: {},
          };
        }

        if (!this.comps[comp].scores[player]) {
          this.comps[comp].scores[player] = [];
        }

        this.comps[comp].scores[player].push({
          hole,
          par: holepar,
          score,
          player,
        });

        this.comps[comp].holes[hole] = { number: hole, par: holepar };
      }
    }
  },
  computed: {
    competitions() {
      return Object.values(this.comps);
    },
  },
});
</script>

<style scoped>
#overview {
  backgorund-color: red;
}
</style>
