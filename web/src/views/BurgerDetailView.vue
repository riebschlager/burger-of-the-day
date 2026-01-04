<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import DataState from "../components/DataState.vue";
import ChalkboardComposer from "../components/ChalkboardComposer.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";
import { formatAirdate, parseAirdate } from "../lib/date";
import type { BurgerRecordView } from "../lib/data";

const route = useRoute();
const { data, loading, error } = useBurgerData();

onMounted(() => {
  ensureBurgerData();
});

const slug = computed(() => String(route.params.slug || ""));

const matches = computed(() => {
  if (!data.value) return [];
  return data.value.burgersBySlug.get(slug.value) ?? [];
});

const sortedMatches = computed(() =>
  [...matches.value].sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return (a.tvmaze_episode_number ?? 0) - (b.tvmaze_episode_number ?? 0);
  })
);

const burgerName = computed(() => sortedMatches.value[0]?.burgerDisplay ?? "Burger");

const uniqueSeasons = computed(() => {
  const set = new Set(sortedMatches.value.map((record) => record.season));
  return Array.from(set);
});

const earliestAirdate = computed(() => {
  if (!data.value) return null;
  const dated = sortedMatches.value
    .map((record) => data.value.episodesById.get(record.tvmaze_episode_id || 0))
    .filter((episode) => episode && episode.airdate)
    .map((episode) => parseAirdate(episode?.airdate))
    .filter((date): date is Date => Boolean(date));

  if (!dated.length) return null;
  return new Date(Math.min(...dated.map((date) => date.getTime())));
});

const episodeForRecord = (record: BurgerRecordView) => {
  if (!data.value) return null;
  return data.value.episodesById.get(record.tvmaze_episode_id || 0) ?? null;
};
</script>

<template>
  <section class="grid gap-8">
    <DataState :loading="loading" :error="error" />

    <div v-if="data" class="grid gap-6">
      <div class="glass-card p-6">
        <p class="text-xs uppercase tracking-[0.3em] text-text/60">Burger detail</p>
        <h1 class="mt-2 text-4xl font-semibold">{{ burgerName }}</h1>
        <div class="mt-4 flex flex-wrap gap-4 text-sm text-text/70">
          <span class="chip">{{ sortedMatches.length }} appearances</span>
          <span class="chip">Seasons {{ uniqueSeasons.join(", ") }}</span>
          <span class="chip" v-if="earliestAirdate">
            First served {{ earliestAirdate.toLocaleDateString() }}
          </span>
        </div>
      </div>

      <ChalkboardComposer :title="burgerName" />
    </div>

    <div v-if="data" class="grid gap-6">
      <div
        v-for="record in sortedMatches"
        :key="`${record.episodeCode}-${record.burgerDisplay}`"
        class="glass-card p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex-1">
            <p class="text-xs uppercase tracking-[0.3em] text-text/60">
              {{ record.episodeCode }}
            </p>
            <router-link
              v-if="record.tvmaze_episode_id"
              :to="`/episodes/${record.episodeCode}`"
              class="mt-2 block text-xl font-semibold text-text hover:text-accent"
            >
              {{ record.episode_title }}
            </router-link>
            <span
              v-else
              class="mt-2 block text-xl font-semibold text-text/80"
            >
              {{ record.episode_title }}
            </span>
            <p class="mt-2 text-sm text-text/70">
              {{ record.burger_of_the_day }}
            </p>
            <p v-if="record.burger_description" class="text-sm text-text/70">
              {{ record.burger_description }}
            </p>
            <p v-if="episodeForRecord(record)?.summaryText" class="mt-3 text-sm text-text/70">
              {{ episodeForRecord(record)?.summaryText }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-3 text-sm text-text/60">
            <div class="h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-muted/60">
              <img
                v-if="episodeForRecord(record)?.image?.medium"
                :src="episodeForRecord(record)?.image?.medium"
                :alt="record.episode_title"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full items-center justify-center text-[0.65rem] uppercase tracking-[0.2em] text-text/50"
              >
                No image
              </div>
            </div>
            <div class="text-right">
              <p>
                {{
                  formatAirdate(
                    data.episodesById.get(record.tvmaze_episode_id || 0)?.airdate
                  )
                }}
              </p>
              <p class="mt-1">Season {{ record.season }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="data && !sortedMatches.length" class="glass-card p-6">
      <p class="text-sm text-text/70">Burger not found.</p>
    </div>
  </section>
</template>
