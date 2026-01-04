<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DataState from "../components/DataState.vue";
import EpisodeCard from "../components/EpisodeCard.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";

const { data, loading, error } = useBurgerData();

const search = ref("");
const selectedSeason = ref<string>("all");
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

  if (selectedSeason.value !== "all") {
    const seasonNumber = Number(selectedSeason.value);
    list = list.filter((episode) => episode.season === seasonNumber);
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
        <select
          v-model="selectedSeason"
          class="rounded-2xl border border-white/10 bg-base/80 px-4 py-3 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <option value="all">All seasons</option>
          <option v-for="season in seasons" :key="season" :value="season">
            Season {{ season }}
          </option>
        </select>
        <label class="flex items-center gap-2 text-sm text-text/70">
          <input v-model="onlyWithBurgers" type="checkbox" class="accent-accent" />
          Only episodes with burgers
        </label>
      </div>
    </div>

    <DataState :loading="loading" :error="error" />

    <div v-if="data" class="flex items-center justify-between text-sm">
      <p class="text-text/70">
        Showing {{ filteredEpisodes.length }} of {{ episodes.length }} episodes
      </p>
      <p class="chip">{{ seasons.length }} seasons</p>
    </div>

    <div v-if="data" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <EpisodeCard
        v-for="episode in filteredEpisodes"
        :key="episode.id"
        :episode="episode"
        :burger-count="data.burgersByEpisodeId.get(episode.id)?.length ?? 0"
      />
    </div>
  </section>
</template>
