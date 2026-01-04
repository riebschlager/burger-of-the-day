<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import DataState from "../components/DataState.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";
import { formatAirdate } from "../lib/date";

const { data, loading, error } = useBurgerData();

const EPISODES_PER_SEASON = 8;

const search = ref("");
const selectedSeason = ref<number | null>(null);
const onlyWithBurgers = ref(false);
const expandedSeasons = ref(new Set<number>());

onMounted(() => {
  ensureBurgerData();
});

const episodes = computed(() => data.value?.episodes ?? []);
const searchQuery = computed(() => search.value.trim().toLowerCase());
const isSearching = computed(() => Boolean(searchQuery.value));

const seasons = computed(() => {
  const set = new Set(episodes.value.map((episode) => episode.season));
  return Array.from(set).sort((a, b) => a - b);
});

const filteredEpisodes = computed(() => {
  let list = [...episodes.value];

  if (onlyWithBurgers.value && data.value) {
    list = list.filter((episode) =>
      data.value?.burgersByEpisodeId.has(episode.id)
    );
  }

  const query = searchQuery.value;
  if (query) {
    list = list.filter((episode) =>
      episode.name.toLowerCase().includes(query)
    );
  } else if (selectedSeason.value !== null) {
    list = list.filter((episode) => episode.season === selectedSeason.value);
  }

  return list.sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.number - b.number;
  });
});

const groupedEpisodes = computed(() => {
  if (!isSearching.value) return [];
  const groups = new Map<number, typeof filteredEpisodes.value>();
  for (const episode of filteredEpisodes.value) {
    const list = groups.get(episode.season) ?? [];
    list.push(episode);
    groups.set(episode.season, list);
  }
  return Array.from(groups.entries())
    .map(([season, list]) => ({
      season,
      episodes: list.sort((a, b) => a.number - b.number),
    }))
    .sort((a, b) => b.season - a.season);
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
  if (isSearching.value || !hasPrevSeason.value) return;
  selectedSeason.value = seasons.value[seasonIndex.value - 1];
};

const goNextSeason = () => {
  if (isSearching.value || !hasNextSeason.value) return;
  selectedSeason.value = seasons.value[seasonIndex.value + 1];
};

const isSeasonExpanded = (season: number) => expandedSeasons.value.has(season);

const toggleSeason = (season: number) => {
  const next = new Set(expandedSeasons.value);
  if (next.has(season)) {
    next.delete(season);
  } else {
    next.add(season);
  }
  expandedSeasons.value = next;
};

const visibleCountFor = (season: number, total: number) => {
  if (isSeasonExpanded(season)) return total;
  return Math.min(total, EPISODES_PER_SEASON);
};

const visibleEpisodes = (season: number, list: typeof filteredEpisodes.value) => {
  if (isSeasonExpanded(season)) return list;
  return list.slice(0, EPISODES_PER_SEASON);
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
            :disabled="isSearching || !hasPrevSeason"
            :class="
              isSearching || !hasPrevSeason ? 'opacity-40 cursor-not-allowed' : ''
            "
            @click="goPrevSeason"
          >
            Prev
          </button>
          <span class="chip">
            <template v-if="isSearching">All seasons</template>
            <template v-else>
              Season {{ selectedSeason ?? "—" }} of {{ seasons.length }}
            </template>
          </span>
          <button
            type="button"
            class="button-ghost px-3 py-2 text-xs uppercase tracking-[0.2em]"
            :disabled="isSearching || !hasNextSeason"
            :class="
              isSearching || !hasNextSeason ? 'opacity-40 cursor-not-allowed' : ''
            "
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
        <template v-if="isSearching">
          Showing {{ filteredEpisodes.length }} matches across
          {{ groupedEpisodes.length }} seasons
        </template>
        <template v-else>
          Showing {{ filteredEpisodes.length }} episodes in season
          {{ selectedSeason ?? "—" }}
        </template>
      </p>
      <p class="chip">{{ seasons.length }} seasons</p>
    </div>

    <div v-if="data && isSearching" class="grid gap-6">
      <div v-if="!groupedEpisodes.length" class="glass-card p-6">
        <p class="text-sm text-text/70">
          No episodes match "{{ search.trim() }}".
        </p>
      </div>
      <div
        v-for="group in groupedEpisodes"
        :key="group.season"
        class="glass-card overflow-hidden"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-muted/60 px-6 py-4"
        >
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-text/60">
              Season {{ group.season }}
            </p>
            <p class="text-xs text-text/60">
              Showing
              {{ visibleCountFor(group.season, group.episodes.length) }} of
              {{ group.episodes.length }} matches
            </p>
          </div>
          <button
            v-if="group.episodes.length > EPISODES_PER_SEASON"
            type="button"
            class="button-ghost px-3 py-2 text-xs uppercase tracking-[0.2em]"
            @click="toggleSeason(group.season)"
          >
            {{ isSeasonExpanded(group.season) ? "Show fewer" : "Show all" }}
          </button>
        </div>
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
                v-for="episode in visibleEpisodes(group.season, group.episodes)"
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
    </div>

    <div v-else-if="data" class="glass-card overflow-hidden">
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
