<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import DataState from "../components/DataState.vue";
import StatCard from "../components/StatCard.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";
import { formatAirdate, isWithinWeekOfToday, parseAirdate } from "../lib/date";

const router = useRouter();
const { data, loading, error } = useBurgerData();

onMounted(() => {
  ensureBurgerData();
});

const records = computed(() => data.value?.records ?? []);
const episodes = computed(() => data.value?.episodes ?? []);

const uniqueBurgerCount = computed(() => {
  const set = new Set(records.value.map((record) => record.burgerSlug));
  return set.size;
});

const episodeCount = computed(() => episodes.value.length);

const seasonCount = computed(() => {
  const set = new Set(episodes.value.map((episode) => episode.season));
  return set.size;
});

const realBurgerRecords = computed(() =>
  records.value.filter(
    (record) => !record.burgerDisplay.toLowerCase().startsWith("none")
  )
);

const weekBurgers = computed(() => {
  if (!data.value) return [];
  const results: Array<{
    burger: typeof realBurgerRecords.value[number];
    airdate: string | null | undefined;
  }> = [];

  for (const episode of episodes.value) {
    const airdate = parseAirdate(episode.airdate);
    if (!airdate || !isWithinWeekOfToday(airdate)) continue;
    const episodeBurgers = data.value.burgersByEpisodeId.get(episode.id) ?? [];
    episodeBurgers.forEach((burger) => {
      if (burger.burgerDisplay.toLowerCase().startsWith("none")) return;
      results.push({ burger, airdate: episode.airdate });
    });
  }

  return results.slice(0, 6);
});

const dailyEpisode = computed(() => {
  if (!episodes.value.length) return null;
  const today = new Date();
  const seed = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % episodes.value.length;
  }
  return episodes.value[Math.abs(hash) % episodes.value.length];
});

const dailyEpisodeBurgerCount = computed(() => {
  if (!dailyEpisode.value || !data.value) return 0;
  return data.value.burgersByEpisodeId.get(dailyEpisode.value.id)?.length ?? 0;
});

const handleRandomBurger = () => {
  const pool = realBurgerRecords.value;
  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  router.push(`/burgers/${pick.burgerSlug}`);
};
</script>

<template>
  <section class="grid gap-8">
    <div class="glass-card p-8">
      <div class="flex flex-col gap-6">
        <p class="chip">Data-fueled burger chaos</p>
        <div>
          <h1 class="text-4xl font-semibold leading-tight md:text-5xl">
            The Bob's Burgers Burgerboard Archive
          </h1>
          <p class="mt-4 max-w-2xl text-base text-text/70">
            Browse every pun, ingredient, and chalkboard surprise. Tap into
            episode metadata, jump by season, and discover what the Belchers
            served this week in history.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <router-link class="button-base" to="/burgers">
            Start browsing
          </router-link>
          <router-link class="button-ghost" to="/episodes">
            Explore episodes
          </router-link>
          <button class="button-ghost" type="button" @click="handleRandomBurger">
            Surprise me
          </button>
        </div>
      </div>
    </div>

    <DataState :loading="loading" :error="error" />

    <div v-if="data" class="grid gap-6 md:grid-cols-4">
      <StatCard label="Total Burgers" :value="records.length" />
      <StatCard label="Unique Burgers" :value="uniqueBurgerCount" />
      <StatCard label="Episodes" :value="episodeCount" />
      <StatCard label="Seasons" :value="seasonCount" />
    </div>

    <section v-if="data" class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div class="glass-card p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-text/60">
              This week in history
            </p>
            <h2 class="mt-2 text-2xl font-semibold">
              Burgers from this week
            </h2>
          </div>
          <span class="chip">{{ weekBurgers.length }} matches</span>
        </div>
        <div class="mt-6 grid gap-4">
          <div
            v-for="item in weekBurgers"
            :key="`${item.burger.episodeCode}-${item.burger.burgerSlug}`"
            class="rounded-2xl border border-white/10 bg-muted/50 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-text/60">
                  {{ item.burger.episodeCode }}
                </p>
                <router-link
                  :to="`/burgers/${item.burger.burgerSlug}`"
                  class="text-lg font-semibold text-text hover:text-accent"
                >
                  {{ item.burger.burgerDisplay }}
                </router-link>
                <p class="text-sm text-text/70">
                  {{ item.burger.episode_title }}
                </p>
              </div>
              <span class="text-xs uppercase tracking-[0.2em] text-text/60">
                {{ formatAirdate(item.airdate) }}
              </span>
            </div>
          </div>
          <p v-if="!weekBurgers.length" class="text-sm text-text/70">
            No episode air dates match this week. Try the randomizer for a fun
            pick.
          </p>
        </div>
      </div>

      <div class="grid gap-6">
        <div class="glass-card p-6">
          <p class="text-xs uppercase tracking-[0.3em] text-text/60">
            Burger roulette
          </p>
          <h2 class="mt-2 text-2xl font-semibold">Spin the chalkboard</h2>
          <p class="mt-3 text-sm text-text/70">
            Pull a random burger and jump straight to the details.
          </p>
          <button class="button-base mt-6 w-full" @click="handleRandomBurger">
            Random burger
          </button>
        </div>

        <div v-if="dailyEpisode" class="glass-card p-6">
          <p class="text-xs uppercase tracking-[0.3em] text-text/60">
            Episode spotlight
          </p>
          <router-link
            :to="`/episodes/${dailyEpisode.code}`"
            class="mt-4 block rounded-2xl border border-white/10 bg-muted/60 p-4 transition hover:-translate-y-1"
          >
            <p class="text-xs uppercase tracking-[0.3em] text-text/60">
              {{ dailyEpisode.code }}
            </p>
            <h3 class="mt-2 text-xl font-semibold">{{ dailyEpisode.name }}</h3>
            <p class="mt-2 text-sm text-text/70">
              {{ dailyEpisode.summaryText || "No summary available." }}
            </p>
            <p class="mt-3 text-xs uppercase tracking-[0.2em] text-text/60">
              {{ dailyEpisodeBurgerCount }} burgers spotted
            </p>
          </router-link>
        </div>
      </div>
    </section>
  </section>
</template>
