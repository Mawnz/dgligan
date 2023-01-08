<template>
  <div class="h-full snap-y overflow-y-auto">
    <section id="overview" class="bg-rose-100 snap-start p-10">
      <Highlight
        :items="items"
      ></Highlight>
      <button @click="goto('start')" class="downbtn rounded-[50%] h-20 w-20 bg-blue-200 p-2">
        <ArrowDownIcon class=""></ArrowDownIcon>
      </button>
    </section>
    <section id="start" class="bg-rose-200 snap-start p-10">
      <button @click="goto('table')" class="downbtn rounded-[50%] h-20 w-20 bg-blue-200 p-2">
        <ArrowDownIcon></ArrowDownIcon>
      </button>
    </section>
    <section id="table" class="bg-rose-100 snap-start p-10">
      <table class="table-auto w-full text-gray-500">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
          <th v-for="h in headers" :key="h.value">
            {{ h.text }}
          </th>
        </thead>
        <tbody>
          <tr v-for="player in playersFull" :key="player.name">
            <td v-for="h in headers" :key="h">
              {{ h.curated ? h.curated(player[h.value]) : player[h.value] }}
            </td>
          </tr>
        </tbody>
      </table>
      <button @click="goto('overview')" class="downbtn rounded-[50%] h-20 w-20 bg-blue-200 p-2">
        <ArrowUpIcon></ArrowUpIcon>
      </button>
    </section>
  </div>
</template>

<script lang="ts">
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/vue/24/outline";

import { defineComponent } from "vue";
import Highlight from "~~/components/Highlight.vue";

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
  playedHoles: number;
  totalThrows: number;
  playedRounds: number;
  avgThrowsPerHole: number;
  totalPossiblePar: number;
  totalPar: number;
  avgParPerRound: number;
  noBirdies: number;
  noPar: number;
  noBoogies: number;
  noAboveBoogies: number;
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
    Highlight
  },
  data() {
    return {
      comps: {} as { [key: string]: Competition },
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
  methods: {
    goto(id: string) {
      this.$el.querySelector(`#${id}`).scrollIntoView({ behavior: 'smooth' })
    },
    calcPlayerTotalPlayedHoles(player: Player): number {
      return Object.values(player.competitions).reduce(
        (throws, comp) => throws + comp.playerScores!.length ?? 0,
        0
      );
    },
    calcPlayerTotalThrows(player: Player): number {
      return Object.values(player.competitions).reduce(
        (throws, comp) =>
          throws +
          comp.playerScores!.reduce((tot, { score }) => tot + score, 0),
        0
      );
    },
    calcPlayerPossibleParTotal(player: Player): number {
      return Object.values(player.competitions).reduce(
        (total, comp) =>
          total + comp.playerScores!.reduce((tot, { par }) => tot + par, 0),
        0
      );
    },
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
    playersFull(): PlayerRow[] {
      return this.players.map((p) => ({
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
          (this.calcPlayerTotalThrows(p) - this.calcPlayerPossibleParTotal(p)) /
            Object.values(p.competitions).length
        ),
      }));
    },
    items(): any[] {
      return this.playersFull.map(p => ({
        name: p.name,
        title: p.name
      }))
    }
  },
});
</script>

<style scoped>
section {
  height: 100%;
  width: 100%;
  position: relative;
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

tr {
  border-bottom: solid 1px #e2e8f0;
}

tr:nth-child(even),
thead {
  background: #e5e7eb;
}

th {
  user-select: none;
  cursor: pointer;
}

th:first-child,
td:first-child {
  padding-left: 15px;
}
th:last-child,
td:last-child {
  padding-right: 15px;
}

th:hover {
  color: #6b7280;
}

th,
td {
  padding: 10px 5px;
}
</style>
