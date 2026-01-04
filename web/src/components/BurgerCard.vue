<script setup lang="ts">
import type { BurgerRecordView, EpisodeView } from "../lib/data";

defineProps<{
  record: BurgerRecordView;
  episode?: EpisodeView | null;
}>();
</script>

<template>
  <router-link
    :to="`/burgers/${record.burgerSlug}`"
    class="group glass-card flex h-full flex-col gap-4 p-5 transition hover:-translate-y-1"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-text/60">
          {{ record.episodeCode }}
        </p>
        <h3 class="mt-2 text-xl font-semibold text-text">
          {{ record.burgerDisplay }}
        </h3>
      </div>
      <span
        class="rounded-full border border-white/20 bg-muted/70 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-widest text-text/80"
      >
        Season {{ record.season }}
      </span>
    </div>
    <p v-if="record.burger_description" class="text-sm text-text/70">
      {{ record.burger_description }}
    </p>
    <div class="mt-auto pt-2 text-sm text-text/70">
      <span class="font-semibold text-text">Episode:</span>
      {{ episode?.name || record.episode_title }}
    </div>
  </router-link>
</template>
