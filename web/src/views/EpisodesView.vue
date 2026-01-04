<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import DataState from "../components/DataState.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";
import { formatAirdate } from "../lib/date";

const { data, loading, error } = useBurgerData();

const search = ref("");
const selectedSeason = ref<number | null>(null);
const onlyWithBurgers = ref(false);

onMounted(() => {
  ensureBurgerData();
});

const episodes = computed(() => data.value?.episodes ?? []);

const seasons = computed(() => {
  const set = new Set(episodes.value.map((episode) => episode.season));
  return Array.from(set).sort((a, b) => a - b);
});

const filteredEpisodes = computed(() => {
  let list = [...episodes.value];

  if (selectedSeason.value !== null) {
    list = list.filter((episode) => episode.season === selectedSeason.value);
  }

  const query = search.value.trim().toLowerCase();
  if (query) {
    list = list.filter((episode) =>
      episode.name.toLowerCase().includes(query)
    );
  }

  if (onlyWithBurgers.value && data.value) {
    list = list.filter((episode) =>
      data.value?.burgersByEpisodeId.has(episode.id)
    );
  }

  return list.sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.number - b.number;
  });
});

const burgerCountFor = (episodeId: number) => {
  return data.value?.burgersByEpisodeId.get(episodeId)?.length ?? 0;
};

const seasonIndex = computed(() => {
  if (selectedSeason.value === null) return -1;
  return seasons.value.indexOf(selectedSeason.value);
});

const hasPrevSeason = computed(() => seasonIndex.value > 0);
const hasNextSeason = computed(
  () => seasonIndex.value >= 0 && seasonIndex.value < seasons.value.length - 1
);

const goPrevSeason = () => {
  if (!hasPrevSeason.value) return;
  selectedSeason.value = seasons.value[seasonIndex.value - 1];
};

const goNextSeason = () => {
  if (!hasNextSeason.value) return;
  selectedSeason.value = seasons.value[seasonIndex.value + 1];
};

watch(
  seasons,
  (newSeasons) => {
    if (!newSeasons.length) return;
    if (selectedSeason.value === null) {
      selectedSeason.value = newSeasons[newSeasons.length - 1];
    }
  },
  { immediate: true }
);
</script>

<template>
  <section class="grid gap-8">
    <div class="glass-card p-6">
      <p class="text-xs uppercase tracking-[0.3em] text-text/60">
        Episode guide
      </p>
      <h1 class="mt-2 text-3xl font-semibold">Episodes</h1>
      <p class="mt-2 text-sm text-text/70">
        Every Bob's Burgers episode with TVMaze metadata.
      </p>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <input
          v-model="search"
          type="search"
          placeholder="Search episodes"
          class="w-full rounded-2xl border border-white/10 bg-base/80 px-4 py-3 text-sm text-text placeholder:text-text/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:w-72"
        />
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="button-ghost px-3 py-2 text-xs uppercase tracking-[0.2em]"
            :disabled="!hasPrevSeason"
            :class="!hasPrevSeason ? 'opacity-40 cursor-not-allowed' : ''"
            @click="goPrevSeason"
          >
            Prev
          </button>
          <span class="chip">
            Season {{ selectedSeason ?? "—" }} of {{ seasons.length }}
          </span>
          <button
            type="button"
            class="button-ghost px-3 py-2 text-xs uppercase tracking-[0.2em]"
            :disabled="!hasNextSeason"
            :class="!hasNextSeason ? 'opacity-40 cursor-not-allowed' : ''"
            @click="goNextSeason"
          >
            Next
          </button>
        </div>
        <label class="flex items-center gap-2 text-sm text-text/70">
          <input v-model="onlyWithBurgers" type="checkbox" class="accent-accent" />
          Only episodes with burgers
        </label>
      </div>
    </div>

    <DataState :loading="loading" :error="error" />

    <div v-if="data" class="flex items-center justify-between text-sm">
      <p class="text-text/70">
        Showing {{ filteredEpisodes.length }} episodes in season
        {{ selectedSeason ?? "—" }}
      </p>
      <p class="chip">{{ seasons.length }} seasons</p>
    </div>

    <div v-if="data" class="glass-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-muted/80 text-xs uppercase tracking-[0.3em] text-text/60">
            <tr>
              <th class="px-6 py-4">Episode</th>
              <th class="px-6 py-4">Season</th>
              <th class="px-6 py-4">Airdate</th>
              <th class="px-6 py-4">Burgers</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            <tr
              v-for="episode in filteredEpisodes"
              :key="episode.id"
              class="transition hover:bg-muted/40"
            >
              <td class="px-6 py-4 align-top">
                <router-link
                  :to="`/episodes/${episode.code}`"
                  class="text-base font-semibold text-text hover:text-accent"
                >
                  {{ episode.name }}
                </router-link>
                <p class="mt-1 text-xs uppercase tracking-[0.3em] text-text/50">
                  {{ episode.code }}
                </p>
                <p class="mt-2 max-w-xl text-xs text-text/60">
                  {{ episode.summaryText || "No summary available." }}
                </p>
              </td>
              <td class="px-6 py-4 align-top text-text/70">
                Season {{ episode.season }}
              </td>
              <td class="px-6 py-4 align-top text-text/70">
                {{ formatAirdate(episode.airdate) }}
              </td>
              <td class="px-6 py-4 align-top text-text/70">
                {{ burgerCountFor(episode.id) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
