<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import DataState from "../components/DataState.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";
import { formatAirdate } from "../lib/date";
import type { BurgerRecordView } from "../lib/data";

const { data, loading, error } = useBurgerData();

const search = ref("");
const selectedSeason = ref<number | null>(null);

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

  list = list.filter(
    (record) => !record.burgerDisplay.toLowerCase().startsWith("none")
  );

  if (selectedSeason.value !== null) {
    list = list.filter((record) => record.season === selectedSeason.value);
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
    if ((a.tvmaze_episode_number ?? 0) !== (b.tvmaze_episode_number ?? 0)) {
      return (a.tvmaze_episode_number ?? 0) - (b.tvmaze_episode_number ?? 0);
    }
    return a.burgerDisplay.localeCompare(b.burgerDisplay);
  });
});

const episodeForRecord = (record: BurgerRecordView) => {
  return data.value?.episodesById.get(record.tvmaze_episode_id || 0) ?? null;
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
        </div>
      </div>
    </div>

    <DataState :loading="loading" :error="error" />

    <div v-if="data" class="flex items-center justify-between text-sm">
      <p class="text-text/70">
        Showing {{ filteredRecords.length }} burgers in season
        {{ selectedSeason ?? "—" }}
      </p>
      <p class="chip">{{ seasons.length }} seasons</p>
    </div>

    <div v-if="data" class="glass-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-muted/80 text-xs uppercase tracking-[0.3em] text-text/60">
            <tr>
              <th class="px-6 py-4">Burger</th>
              <th class="px-6 py-4">Episode</th>
              <th class="px-6 py-4">Season</th>
              <th class="px-6 py-4">Airdate</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            <tr
              v-for="record in filteredRecords"
              :key="`${record.episodeCode}-${record.burgerSlug}-${record.burgerDisplay}`"
              class="transition hover:bg-muted/40"
            >
              <td class="px-6 py-4 align-top">
                <router-link
                  :to="`/burgers/${record.burgerSlug}`"
                  class="text-base font-semibold text-text hover:text-accent"
                >
                  {{ record.burgerDisplay }}
                </router-link>
                <p v-if="record.burger_description" class="mt-1 text-xs text-text/60">
                  {{ record.burger_description }}
                </p>
                <p
                  v-else-if="record.burger_of_the_day !== record.burgerDisplay"
                  class="mt-1 text-xs text-text/60"
                >
                  {{ record.burger_of_the_day }}
                </p>
              </td>
              <td class="px-6 py-4 align-top text-sm text-text/70">
                <div v-if="episodeForRecord(record)">
                  <router-link
                    :to="`/episodes/${record.episodeCode}`"
                    class="font-semibold text-text hover:text-accent"
                  >
                    {{ record.episode_title }}
                  </router-link>
                  <p class="mt-1 text-xs uppercase tracking-[0.3em] text-text/50">
                    {{ record.episodeCode }}
                  </p>
                </div>
                <div v-else>
                  <p class="font-semibold text-text/80">{{ record.episode_title }}</p>
                  <p class="mt-1 text-xs uppercase tracking-[0.3em] text-text/50">
                    {{ record.episodeCode }}
                  </p>
                </div>
              </td>
              <td class="px-6 py-4 align-top text-text/70">
                Season {{ record.season }}
              </td>
              <td class="px-6 py-4 align-top text-text/70">
                {{ formatAirdate(episodeForRecord(record)?.airdate) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
