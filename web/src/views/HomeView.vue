<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import DataState from "../components/DataState.vue";
import ChalkboardComposer from "../components/ChalkboardComposer.vue";
import StatCard from "../components/StatCard.vue";
import { ensureBurgerData, useBurgerData } from "../composables/useBurgerData";
import { formatAirdate, isWithinWeekOfToday, parseAirdate } from "../lib/date";
import { slugify } from "../lib/slug";
import type { BurgerRecordView } from "../lib/data";

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

const chalkboardBurger = ref<BurgerRecordView | null>(null);

const chalkboardEpisode = computed(() => {
  const bundle = data.value;
  const record = chalkboardBurger.value;
  if (!bundle || !record) return null;
  if (record.tvmaze_episode_id) {
    return bundle.episodesById.get(record.tvmaze_episode_id) ?? null;
  }
  const episodeSlug = slugify(record.episode_title);
  return (
    bundle.episodes.find((episode) => slugify(episode.name) === episodeSlug) ??
    null
  );
});

const weekBurgers = computed(() => {
  const bundle = data.value;
  if (!bundle) return [];
  const results: Array<{
    burger: typeof realBurgerRecords.value[number];
    airdate: string | null | undefined;
  }> = [];

  for (const episode of episodes.value) {
    const airdate = parseAirdate(episode.airdate);
    if (!airdate || !isWithinWeekOfToday(airdate)) continue;
    const episodeBurgers = bundle.burgersByEpisodeId.get(episode.id) ?? [];
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
  const bundle = data.value;
  const currentEpisode = dailyEpisode.value;
  if (!currentEpisode || !bundle) return 0;
  return bundle.burgersByEpisodeId.get(currentEpisode.id)?.length ?? 0;
});

const chalkboardTitle = computed(
  () => chalkboardBurger.value?.burgerDisplay ?? "Burger of the Day"
);

const chalkboardDescription = computed(() => {
  const record = chalkboardBurger.value;
  if (!record) return "";
  if (record.burger_description) return record.burger_description;
  const match = record.burger_of_the_day?.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
});

const customBurgerName = ref("The Make It Yours Burger");
const customBurgerDescription = ref("Built with whatever you love.");
const customBurgerPrice = ref("");
const customTitleSizeAdjust = ref(0);
const customDescriptionSizeAdjust = ref(0);
const customPriceSizeAdjust = ref(0);
const customPriceScale = 0.75;

const SIZE_ADJUST_MIN = -6;
const SIZE_ADJUST_MAX = 6;

const clampAdjust = (value: number) =>
  Math.min(SIZE_ADJUST_MAX, Math.max(SIZE_ADJUST_MIN, value));

const bumpSize = (target: "title" | "description" | "price", delta: number) => {
  if (target === "title") {
    customTitleSizeAdjust.value = clampAdjust(
      customTitleSizeAdjust.value + delta
    );
    return;
  }
  if (target === "description") {
    customDescriptionSizeAdjust.value = clampAdjust(
      customDescriptionSizeAdjust.value + delta
    );
    return;
  }
  customPriceSizeAdjust.value = clampAdjust(customPriceSizeAdjust.value + delta);
};

const formatAdjust = (value: number) => {
  if (value === 0) return "Normal";
  return value > 0 ? `+${value}` : `${value}`;
};

const customTitle = computed(() => customBurgerName.value.trim() || "Your Burger");
const customDescription = computed(() => customBurgerDescription.value.trim());
const customPrice = computed(() => customBurgerPrice.value.trim());

const pickRandomBurger = () => {
  const pool = realBurgerRecords.value;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

const spinChalkboard = () => {
  const pick = pickRandomBurger();
  if (!pick) return;
  chalkboardBurger.value = pick;
};

const handleRandomBurger = () => {
  const pick = pickRandomBurger();
  if (!pick) return;
  router.push(`/burgers/${pick.burgerSlug}`);
};

watch(
  realBurgerRecords,
  (recordsList) => {
    if (!recordsList.length) {
      chalkboardBurger.value = null;
      return;
    }
    if (!chalkboardBurger.value) {
      chalkboardBurger.value =
        recordsList[Math.floor(Math.random() * recordsList.length)];
    }
  },
  { immediate: true }
);
</script>

<template>
  <section class="grid gap-8">
    <div class="glass-card p-8">
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-4xl font-semibold leading-tight md:text-5xl">
            The Bob's Burgers Burger of the Day Archive
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
        <ChalkboardComposer
          :title="chalkboardTitle"
          :description="chalkboardDescription"
          label="Burger roulette"
          heading="Spin the chalkboard"
          copy="Spin for a random burger, then download the chalkboard."
        >
          <template #meta>
            <div class="rounded-2xl border border-white/10 bg-muted/50 p-4 text-center">
              <p class="text-xs uppercase tracking-[0.3em] text-text/60">
                Episode
              </p>
              <router-link
                v-if="chalkboardEpisode"
                :to="`/episodes/${chalkboardEpisode.code}`"
                class="mt-2 block text-base font-semibold text-text hover:text-accent"
              >
                {{ chalkboardEpisode.name }}
              </router-link>
              <p v-else class="mt-2 text-base font-semibold text-text/80">
                {{ chalkboardBurger?.episode_title ?? "Episode unavailable" }}
              </p>
              <p class="mt-1 text-xs uppercase tracking-[0.2em] text-text/60">
                Aired {{ formatAirdate(chalkboardEpisode?.airdate) }}
              </p>
            </div>
          </template>
          <template #actions>
            <button class="button-ghost" type="button" @click="spinChalkboard">
              Spin again
            </button>
          </template>
        </ChalkboardComposer>

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

    <section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div class="glass-card p-6">
        <p class="text-xs uppercase tracking-[0.3em] text-text/60">
          Make your own
        </p>
        <h2 class="mt-2 text-2xl font-semibold">Create a burger of the day</h2>
        <p class="mt-2 text-sm text-text/70">
          Add a name, description, and optional price to craft your own
          chalkboard.
        </p>
        <div class="mt-6 grid gap-4">
          <div class="grid gap-2 text-sm text-text/70">
            <label for="custom-burger-name">Burger name</label>
            <input
              id="custom-burger-name"
              v-model="customBurgerName"
              type="text"
              placeholder="The Make It Yours Burger"
              class="w-full rounded-2xl border border-white/10 bg-base/80 px-4 py-3 text-sm text-text placeholder:text-text/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-text/60">
              <span>Size</span>
              <button
                type="button"
                class="button-ghost px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]"
                :disabled="customTitleSizeAdjust <= SIZE_ADJUST_MIN"
                @click="bumpSize('title', -1)"
              >
                -
              </button>
              <span class="min-w-[3.5rem] text-center">
                {{ formatAdjust(customTitleSizeAdjust) }}
              </span>
              <button
                type="button"
                class="button-ghost px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]"
                :disabled="customTitleSizeAdjust >= SIZE_ADJUST_MAX"
                @click="bumpSize('title', 1)"
              >
                +
              </button>
            </div>
          </div>
          <div class="grid gap-2 text-sm text-text/70">
            <label for="custom-burger-description">Description</label>
            <textarea
              id="custom-burger-description"
              v-model="customBurgerDescription"
              rows="2"
              placeholder="Built with whatever you love."
              class="w-full resize-none rounded-2xl border border-white/10 bg-base/80 px-4 py-3 text-sm text-text placeholder:text-text/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            ></textarea>
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-text/60">
              <span>Size</span>
              <button
                type="button"
                class="button-ghost px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]"
                :disabled="customDescriptionSizeAdjust <= SIZE_ADJUST_MIN"
                @click="bumpSize('description', -1)"
              >
                -
              </button>
              <span class="min-w-[3.5rem] text-center">
                {{ formatAdjust(customDescriptionSizeAdjust) }}
              </span>
              <button
                type="button"
                class="button-ghost px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]"
                :disabled="customDescriptionSizeAdjust >= SIZE_ADJUST_MAX"
                @click="bumpSize('description', 1)"
              >
                +
              </button>
            </div>
          </div>
          <div class="grid gap-2 text-sm text-text/70">
            <label for="custom-burger-price">Price (optional)</label>
            <input
              id="custom-burger-price"
              v-model="customBurgerPrice"
              type="text"
              placeholder="$12.95"
              class="w-full rounded-2xl border border-white/10 bg-base/80 px-4 py-3 text-sm text-text placeholder:text-text/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-text/60">
              <span>Size</span>
              <button
                type="button"
                class="button-ghost px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]"
                :disabled="customPriceSizeAdjust <= SIZE_ADJUST_MIN"
                @click="bumpSize('price', -1)"
              >
                -
              </button>
              <span class="min-w-[3.5rem] text-center">
                {{ formatAdjust(customPriceSizeAdjust) }}
              </span>
              <button
                type="button"
                class="button-ghost px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]"
                :disabled="customPriceSizeAdjust >= SIZE_ADJUST_MAX"
                @click="bumpSize('price', 1)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChalkboardComposer
        :title="customTitle"
        :description="customDescription"
        :price="customPrice"
        :title-size-adjust="customTitleSizeAdjust"
        :description-size-adjust="customDescriptionSizeAdjust"
        :price-size-adjust="customPriceSizeAdjust"
        :price-scale="customPriceScale"
        label="Custom chalkboard"
        heading="Download your burger"
        copy="Share the chalkboard image with your custom burger."
      />
    </section>
  </section>
</template>
