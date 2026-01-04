<script setup lang="ts">
import type { EpisodeView } from "../lib/data";
import { formatAirdate } from "../lib/date";

const props = defineProps<{
  episode: EpisodeView;
  burgerCount?: number;
}>();
</script>

<template>
  <router-link
    :to="`/episodes/${props.episode.code}`"
    class="group glass-card flex h-full flex-col gap-4 p-5 transition hover:-translate-y-1"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-text/60">
          {{ props.episode.code }}
        </p>
        <h3 class="mt-2 text-xl font-semibold text-text">
          {{ props.episode.name }}
        </h3>
      </div>
      <span
        class="rounded-full border border-white/20 bg-muted/70 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-widest text-text/80"
      >
        {{ formatAirdate(props.episode.airdate) }}
      </span>
    </div>
    <p class="max-h-16 overflow-hidden text-sm text-text/70">
      {{ props.episode.summaryText || "No summary available." }}
    </p>
    <div class="mt-auto text-sm text-text/70">
      {{ props.burgerCount ?? 0 }} burger{{ (props.burgerCount ?? 0) === 1 ? "" : "s" }}
      spotted
    </div>
  </router-link>
</template>
