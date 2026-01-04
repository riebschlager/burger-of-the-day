<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import DataState from "../components/DataState.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";
import { formatAirdate } from "../lib/date";
import { slugify } from "../lib/slug";

const route = useRoute();
const { data, loading, error } = useBurgerData();

onMounted(() => {
  ensureBurgerData();
});

const code = computed(() => String(route.params.code || "").toLowerCase());

const episode = computed(() => {
  if (!data.value) return null;
  return data.value.episodesByCode.get(code.value) ?? null;
});

const episodeIndex = computed(() => {
  if (!data.value || !episode.value) return -1;
  return data.value.episodes.findIndex((item) => item.id === episode.value?.id);
});

const prevEpisode = computed(() => {
  if (!data.value || episodeIndex.value <= 0) return null;
  return data.value.episodes[episodeIndex.value - 1] ?? null;
});

const nextEpisode = computed(() => {
  if (!data.value || episodeIndex.value < 0) return null;
  return data.value.episodes[episodeIndex.value + 1] ?? null;
});

const burgerList = computed(() => {
  if (!data.value || !episode.value) return [];
  const fromId = data.value.burgersByEpisodeId.get(episode.value.id);
  if (fromId && fromId.length) return fromId;

  const episodeSlug = slugify(episode.value.name);
  return data.value.records.filter(
    (record) => slugify(record.episode_title) === episodeSlug
  );
});
</script>

<template>
  <section class="grid gap-8">
    <DataState :loading="loading" :error="error" />

    <div v-if="data && episode" class="flex flex-wrap items-center justify-between gap-4">
      <router-link class="button-ghost" to="/episodes">Back to episodes</router-link>
      <div class="flex items-center gap-2">
        <router-link
          v-if="prevEpisode"
          class="button-ghost"
          :to="`/episodes/${prevEpisode.code}`"
        >
          Previous episode
        </router-link>
        <span
          v-else
          class="button-ghost cursor-not-allowed opacity-40"
          aria-disabled="true"
        >
          Previous episode
        </span>
        <router-link
          v-if="nextEpisode"
          class="button-ghost"
          :to="`/episodes/${nextEpisode.code}`"
        >
          Next episode
        </router-link>
        <span
          v-else
          class="button-ghost cursor-not-allowed opacity-40"
          aria-disabled="true"
        >
          Next episode
        </span>
      </div>
    </div>

    <div v-if="data && episode" class="glass-card p-6">
      <div class="flex flex-col gap-6 md:flex-row md:items-start">
        <div class="flex-1">
          <p class="text-xs uppercase tracking-[0.3em] text-text/60">
            {{ episode.code }}
          </p>
          <h1 class="mt-2 text-4xl font-semibold">{{ episode.name }}</h1>
          <p class="mt-3 text-sm text-text/70">
            {{ episode.summaryText || "No summary available." }}
          </p>
          <div class="mt-4 flex flex-wrap gap-3 text-sm text-text/70">
            <span class="chip">Aired {{ formatAirdate(episode.airdate) }}</span>
            <span class="chip">Runtime {{ episode.runtime ?? "?" }} min</span>
            <span class="chip">
              Rating {{ episode.ratingValue ?? "N/A" }}
            </span>
          </div>
        </div>
        <div class="w-full md:w-60">
          <img
            v-if="episode.image?.medium"
            :src="episode.image.medium"
            :alt="episode.name"
            class="w-full rounded-2xl border border-white/10 object-cover"
          />
          <div
            v-else
            class="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-muted/60 text-sm text-text/60"
          >
            No image
          </div>
        </div>
      </div>
    </div>

    <div v-if="data && episode" class="grid gap-6">
      <div class="glass-card p-6">
        <h2 class="text-2xl font-semibold">Burger(s) in this episode</h2>
        <div class="mt-4 grid gap-4">
          <div
            v-for="record in burgerList"
            :key="record.burgerDisplay + record.episodeCode"
            class="rounded-2xl border border-white/10 bg-muted/60 p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <router-link
                  :to="`/burgers/${record.burgerSlug}`"
                  class="text-lg font-semibold text-text hover:text-accent"
                >
                  {{ record.burgerDisplay }}
                </router-link>
                <p class="text-sm text-text/70">
                  {{ record.burger_of_the_day }}
                </p>
                <p v-if="record.burger_description" class="text-sm text-text/70">
                  {{ record.burger_description }}
                </p>
              </div>
              <span class="chip">Season {{ record.season }}</span>
            </div>
          </div>
          <p v-if="!burgerList.length" class="text-sm text-text/70">
            No readable burger of the day found for this episode.
          </p>
        </div>
      </div>
    </div>

    <div v-if="data && !episode" class="glass-card p-6">
      <p class="text-sm text-text/70">Episode not found.</p>
    </div>
  </section>
</template>
