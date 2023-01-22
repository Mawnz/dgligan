<template>
  <div
    class="
      bg-background-light
      dark:bg-background-dark
      h-full
      snap-y
      overflow-y-auto
      flex flex-col
    "
  >
    <!-- <section id="overview" class="snap-start p-10">
      <TransitionRoot :show="true">
        <TransitionChild
          :enter="`transform transition duration-[400ms]`"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          :leave="`transform duration-500 transition ease-in-out`"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
          v-for="(item, i) in items"
          :key="item.name"
          :style="{
            'transition-delay': `${i * 500}ms`,
          }"
        >
          <div
            class="
              item
              drop-shadow-lg
              rounded-lg
              p-10
              mb-5
              dark:bg-secondary-dark
              bg-secondary-light
            "
            @click="next"
          >
            {{ item.name }}
          </div>
        </TransitionChild>
      </TransitionRoot>
    </section> -->
    <!-- <section id="start" class="snap-start p-10">
    </section> -->
    <section id="table" class="snap-start">
      <table class="table-auto w-full">
        <thead
          class="
            text-center
            dark:border-white
            border-black border-y
            bg-primary-light
            dark:bg-primary-dark dark:text-white
          "
        >
          <th :colspan="overviewHeaders.length">Bästa spelarna 2023</th>
        </thead>
        <tbody>
          <tr
            class="
              text-center
              dark:border-white
              border-black border-y
              bg-secondary-light
              dark:bg-secondary-dark
            "
            v-for="player in playersShort"
            :key="player.name"
          >
            <td v-for="h in overviewHeaders" :key="h.value">
              {{ player[h.value] }}
            </td>
          </tr>
        </tbody>
      </table>
      <!--
      <table class="table-auto w-full text-gray-500">
        <thead class="
          bg-secondary-light
          text-xs text-gray-600
          dark:text-gray-200
          uppercase
        ">
          <th v-for="h in headers" :key="h.value" @click="sort(h)">
            {{ h.text }}
          </th>
        </thead>
        <tbody>
          <tr
            v-for="player in playersFull"
            :key="player.name"
            class="
              even:bg-secondary-light
              text-gray-600
              dark:text-gray-200
            "
          >
            <td v-for="h in headers" :key="h">
              {{ h.curated ? h.curated(player[h.value]) : player[h.value] }}
            </td>
          </tr>
        </tbody>
      </table>
      -->
    </section>
    <!-- <button
        @click="goto()"
        class="
          downbtn
          rounded-[50%]
          h-20
          w-20
          primary
          p-2
          dark:bg-secondary-dark
          bg-secondary-light
        "
      >
        <ArrowDownIcon v-if="notLast" class=""></ArrowDownIcon>
        <ArrowUpIcon v-else></ArrowUpIcon>
      </button> -->
  </div>
</template>

<script lang="ts">
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/vue/24/outline";

import { CreateComponentPublicInstance, defineComponent } from "vue";
import Highlight from "~~/components/Highlight.vue";

import { TransitionRoot, TransitionChild } from "@headlessui/vue";

import { debounce } from "lodash";

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
  holes?: { [key: number]: Hole };
  scores?: { [key: string]: Score[] };
  playerScores?: Score[];
  date?: string;
}

interface Player {
  competitions: { [key: string]: Competition };
  name: string;
}

interface PlayerRow extends Player {
  rank?: number;
  playedHoles?: number;
  totalThrows?: number;
  playedRounds?: number;
  avgThrowsPerHole?: number;
  totalPossiblePar?: number;
  totalPar?: number;
  avgParPerRound?: number;
  noBirdies?: number;
  noPar?: number;
  noBoogies?: number;
  noAboveBoogies?: number;
}

interface TableHeader {
  text: string;
  value: string;
  curated?: (val: any) => string;
}

export default defineComponent({
  components: {
    ArrowDownIcon,
    ArrowUpIcon,
    Highlight,
    TransitionChild,
    TransitionRoot,
  },
  data() {
    return {
      sortBy: null as TableHeader | null,
      sortDesc: true,
      comps: {} as { [key: string]: Competition },
      notLast: true,
      overviewHeaders: [
        { text: "Rank", value: "rank" },
        { text: "Namn", value: "name" },
        { text: "Poäng", value: "score" },
      ],
      headers: [
        { text: "Namn", value: "name" },
        { text: "Totalt spelade hål", value: "playedHoles" },
        { text: "Totalt antal kast", value: "totalThrows" },
        { text: "Totalt spelade rundor", value: "playedRounds" },
        { text: "Kast per hål (snitt)", value: "avgThrowsPerHole" },
        { text: "Total möjlig par", value: "totalPossiblePar" },
        {
          text: "Total par",
          value: "totalPar",
          curated: (par: number) =>
            par < 0 ? `-${par}` : par > 0 ? `+${par}` : par,
        },
        {
          text: "Snitt per runda",
          value: "avgParPerRound",
          curated: (par: number) =>
            par < 0 ? `-${par}` : par > 0 ? `+${par}` : par,
        },
        { text: "Antal birdie", value: "noBirdies" },
        { text: "Antal par", value: "noPar" },
        { text: "Antal boogie", value: "noBoogies" },
        { text: "Antal > +1", value: "noAboveBoogies" },
      ] as TableHeader[],
    };
  },
  created() {
    useFetch(
      "https://docs.google.com/spreadsheets/d/1U8vlST4Y66HoIdv2KtQHh_GagpLVheFBsQRQ_uCP7Nk/gviz/tq?tqx=out:csv&sheet=meta"
    ).then((meta) => {
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
      useFetch(
        "https://docs.google.com/spreadsheets/d/1U8vlST4Y66HoIdv2KtQHh_GagpLVheFBsQRQ_uCP7Nk/gviz/tq?tqx=out:csv&sheet=raw"
      ).then((raw) => {
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
      });
    });
  },
  mounted() {
    this.$el.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    this.$el.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    handleScroll: debounce(function (this: any, e: Event) {
      const { top, height } = document
        .querySelector("section#table")!
        .getBoundingClientRect();
      this.notLast = top > height / 2;
    }, 25),
    sort(h: TableHeader) {
      if (this.sortBy?.value === h.value) {
        this.sortDesc = !this.sortDesc;
      } else {
        this.sortDesc = true;
        this.sortBy = h;
      }
    },
    //
    // Scrollt smoothly to section
    //
    goto(id: string) {
      this.$el.querySelector(`#${id}`).scrollIntoView({ behavior: "smooth" });
    },
    //
    // Sum of played holes for player
    //
    calcPlayerTotalPlayedHoles(player: Player): number {
      return Object.values(player.competitions).reduce(
        (throws, comp) => throws + comp.playerScores!.length ?? 0,
        0
      );
    },
    //
    // Sum of throws per hole for player
    //
    calcPlayerTotalThrows(player: Player): number {
      return Object.values(player.competitions).reduce(
        (throws, comp) =>
          throws +
          comp.playerScores!.reduce((tot, { score }) => tot + score, 0),
        0
      );
    },
    //
    // Sum all par for player on played holes
    //
    calcPlayerPossibleParTotal(player: Player): number {
      return Object.values(player.competitions).reduce(
        (total, comp) =>
          total + comp.playerScores!.reduce((tot, { par }) => tot + par, 0),
        0
      );
    },
    //
    // Used to calculate number of (birdies, par, boogey etc)
    //
    calcPlayerNumberOfScore(
      player: Player,
      scoreComparison: (score: number, par: number) => number
    ) {
      return Object.values(player.competitions).reduce(
        (birdies, comp) =>
          birdies +
          comp.playerScores!.reduce(
            (b, { score, par }) => b + scoreComparison(score, par),
            0
          ),
        0
      );
    },
    //
    // Calc competition score
    //
    calcCompScore(comp: Competition): number {
      return (
        comp.playerScores?.reduce(
          (tot, { par, score }) => (tot += score - par),
          0
        ) ?? 0
      );
    },
    //
    // Calc position of comp
    //
    calcCompRank(player: string, comp?: Competition): number {
      if (!comp) {
        return 0;
      }
      return (
        Object.entries(comp.scores as any)
          .reduce(
            (totals: any, cur: any) => {
              return [
                ...totals,
                {
                  name: cur[0],
                  total: Object.values(cur[1]).reduce(
                    (sum: any, { par, score }: any) => sum + (score - par),
                    0
                  ),
                }
              ]
            }),
            []
          )
          .sort((a: any, b: any) => {
            console.log(a.total, b.total)
            if (a.total < b.total) return 1;
            if (a.total > b.total) return -1;
            return 0;
          })
          .findIndex((p: any) => p.name === player) + 1
    },
    calcPlayerScoreBestFour(p: Player): number {
      return Object.values(p.competitions)
        .reduce(
          (ranks: number[], comp) => [
            ...ranks,
            this.calcCompRank(
              p.name,
              this.competitions.find((c) => c.name === comp.name)
            ),
          ],
          []
        )
        .sort()
        .splice(0, 3)
        .reduce((sum, cur) => sum + cur, 0);
    },
  },
  computed: {
    competitions(): Competition[] {
      return Object.values(this.comps);
    },
    players(): Player[] {
      const players = Object.values(this.comps).reduce((players, comp) => {
        for (let player in comp.scores) {
          if (!players.hasOwnProperty(player)) {
            players[player] = {
              name: player,
              competitions: {},
            };
          }
          if (!players[player].competitions.hasOwnProperty(comp.name)) {
            players[player].competitions[comp.name] = {
              name: comp.name,
              playerScores: comp.scores[player],
            };
          }
        }
        return players;
      }, {} as { [key: string]: Player });

      return Object.values(players);
    },
    playersShort(): PlayerRow[] {
      return this.players
        .map((p) => ({
          ...p,
          score: this.calcPlayerScoreBestFour(p),
        }))
        .sort((a, b) => {
          if (a.score < b.score) return 1;
          if (a.score > b.score) return -1;
          return 0;
        })
        .map((p, i) => ({
          ...p,
          rank: i + 1,
        }));
    },
    playersFull(): PlayerRow[] {
      return this.players
        .map((p) => ({
          ...p,
          playedHoles: this.calcPlayerTotalPlayedHoles(p),
          playedRounds: Object.values(p.competitions).length,
          totalThrows: this.calcPlayerTotalThrows(p),
          totalPossiblePar: this.calcPlayerPossibleParTotal(p),
          totalPar:
            this.calcPlayerTotalThrows(p) - this.calcPlayerPossibleParTotal(p),
          noBirdies: this.calcPlayerNumberOfScore(p, (score, par) =>
            score - par === -1 ? 1 : 0
          ),
          noPar: this.calcPlayerNumberOfScore(p, (score, par) =>
            score - par === 0 ? 1 : 0
          ),
          noBoogies: this.calcPlayerNumberOfScore(p, (score, par) =>
            score - par === 1 ? 1 : 0
          ),
          noAboveBoogies: this.calcPlayerNumberOfScore(p, (score, par) =>
            score - par > 1 ? 1 : 0
          ),
          avgThrowsPerHole:
            Math.round(
              (this.calcPlayerTotalThrows(p) /
                this.calcPlayerTotalPlayedHoles(p)) *
                100
            ) / 100,
          avgParPerRound: Math.round(
            (this.calcPlayerTotalThrows(p) -
              this.calcPlayerPossibleParTotal(p)) /
              Object.values(p.competitions).length
          ),
        }))
        .sort((a: any, b: any) => {
          if (this.sortBy) {
            if (a[this.sortBy!.value] > b[this.sortBy!.value]) {
              return this.sortDesc ? -1 : 1;
            }
            if (a[this.sortBy!.value] < b[this.sortBy!.value]) {
              return this.sortDesc ? 1 : -1;
            }
          }
          return 0;
        });
    },
    items(): any[] {
      return this.playersFull.map((p) => ({
        name: p.name,
        title: p.name,
      }));
    },
  },
});
</script>

<style scoped>
.snap-y {
  min-height: 100%;
}
section {
  width: 100%;
  position: relative;
  min-height: 100%;
}
.downbtn {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  animation: pointdown 1s infinite ease-in-out;
}

@keyframes pointdown {
  0% {
    transform: translate(-50%, 0);
  }

  50% {
    transform: translate(-50%, 8px);
  }

  100% {
    transform: translate(-50%, 0);
  }
}

th,
td {
  user-select: none;
  cursor: pointer;
}

th,
td {
  padding: 10px 5px;
  font-size: 0.8rem;
}
</style>
