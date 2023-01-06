<template>
  <div class="h-full container flex-col">
    <section id="overview">
      <table>
        <tr>
          <th>
            Namn
          </th>
          <th>
            Totalt spelade hål
          </th>
          <th>
            Totalt antal kast
          </th>
          <th>
            Kast per hål (snitt)
          </th>
          <th>
            Total möjlig par
          </th>
          <th>
            Total spelad par
          </th>
          <th>
            Antal birdie
          </th>
          <th>
            Antal par
          </th>
          <th>
            Antal boogie
          </th>
          <th>
            Antal > +1
          </th>
        </tr>
        <tbody>
          <tr v-for="player in players" :key="player.name">
            <td>
              {{ player.name }}
            </td>
            <td>
              {{ calcPlayerTotalPlayedHoles(player) }}
            </td>
            <td>
              {{ calcPlayerTotalThrows(player) }}
            </td>
            <td>
              {{ Math.round((calcPlayerTotalThrows(player) / calcPlayerTotalPlayedHoles(player)) * 100) / 100 }}
            </td>
            <td>
              {{ calcPlayerParTotal(player) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
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
  holes?: { [key: number]: Hole };
  scores?: { [key: string]: Score[] };
  playerScores?: Score[];
  date?: string;
}

interface Player {
  competitions: { [key:string]: Competition };
  name: string;
}

export default defineComponent({
  data() {
    return {
      comps: {} as { [key: string]: Competition },
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
    calcPlayerTotalPlayedHoles(player: Player): number {
      let total = 0;
      let comps = player.competitions;
      for(let c in comps) {
        total += comps[c].playerScores!.length
      }
      return total;
    },
    calcPlayerTotalThrows(player: Player): number {
      let total = 0;
      let comps = player.competitions;
      for(let c in comps) {
        let throws = comps[c].playerScores!.reduce((sum, { score }) => sum + score, 0)
        total += throws;
      }
      return total;
    },
    calcPlayerParTotal(player: Player): number {
      let total = 0;
      let comps = player.competitions;
      for(let c in comps) {
        let diff = comps[c].playerScores!.reduce((sum, { score }) => sum + score, 0) - comps[c].playerScores!.reduce((su, { par })  => su + par, 0);
        total += diff;
      }

      return total;
    },
      calcPlayerAvgThrows(comps: Competition[]): number {
      let avg = 0;
      let playerHolesTotal = 0;
      for(let c of comps) {
        avg += 1;
      }

      return avg;
    }
  },
  computed: {
    competitions(): Competition[] {
      return Object.values(this.comps);
    },
    players(): Player[] {
      const players = Object.values(this.comps).reduce((players, comp) => {
        for(let player in comp.scores) {
          if(!players.hasOwnProperty(player)) {
            players[player] = {
              name: player,
              competitions: {}
            }
          }
          if(!players[player].competitions.hasOwnProperty(comp.name)) {
            players[player].competitions[comp.name] = {
              name: comp.name, playerScores: comp.scores[player]
            }
          }
        }

        return players;
      }, {} as { [key:string]: Player });

      return Object.values(players);
    },
    worst() {
      for(let player of this.players) {
        console.log(player.name, this.calcPlayerAvgPar(player.competitions))
      }
      return 'me'
    }
  },
});
</script>

<style scoped>
#overview {
  backgorund-color: red;
}

table, th, td {
  border: solid 1px;
}

th, td {
  padding: 5px;
}

</style>
