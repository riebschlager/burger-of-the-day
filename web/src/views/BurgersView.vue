<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import BurgerCard from "../components/BurgerCard.vue";
import DataState from "../components/DataState.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";

const { data, loading, error } = useBurgerData();

const search = ref("");
const selectedSeason = ref<string>("all");
const hideMissing = ref(true);

onMounted(() => {
  ensureBurgerData();
});

const records = computed(() => data.value?.records ?? []);

const seasons = computed(() => {
  const set = new Set(records.value.map((record) => record.season));
  return Array.from(set).sort((a, b) => a - b);
});

const filteredRecords = computed(() => {
  let list = [...records.value];

  if (hideMissing.value) {
    list = list.filter(
      (record) => !record.burgerDisplay.toLowerCase().startsWith("none")
    );
  }

  if (selectedSeason.value !== "all") {
    const seasonNumber = Number(selectedSeason.value);
    list = list.filter((record) => record.season === seasonNumber);
  }

  const query = search.value.trim().toLowerCase();
  if (query) {
    list = list.filter(
      (record) =>
        record.burgerDisplay.toLowerCase().includes(query) ||
        record.episode_title.toLowerCase().includes(query)
    );
  }

  return list.sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.burgerDisplay.localeCompare(b.burgerDisplay);
  });
});
</script>

<template>
  <section class="grid gap-8">
    <div class="glass-card p-6">
      <div class="flex flex-col gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-text/60">
            Burger catalog
          </p>
          <h1 class="mt-2 text-3xl font-semibold">All burgers</h1>
          <p class="mt-2 text-sm text-text/70">
            Search by burger name, pun, or episode title.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <input
            v-model="search"
            type="search"
            placeholder="Search burgers or episodes"
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
            <input v-model="hideMissing" type="checkbox" class="accent-accent" />
            Hide unreadable burgers
          </label>
        </div>
      </div>
    </div>

    <DataState :loading="loading" :error="error" />

    <div v-if="data" class="flex items-center justify-between text-sm">
      <p class="text-text/70">
        Showing {{ filteredRecords.length }} of {{ records.length }} entries
      </p>
      <p class="chip">{{ seasons.length }} seasons</p>
    </div>

    <div v-if="data" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <BurgerCard
        v-for="record in filteredRecords"
        :key="`${record.episodeCode}-${record.burgerSlug}-${record.burgerDisplay}`"
        :record="record"
        :episode="data.episodesById.get(record.tvmaze_episode_id || 0) || null"
      />
    </div>
  </section>
</template>
