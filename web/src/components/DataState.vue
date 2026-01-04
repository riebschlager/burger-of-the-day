<script setup lang="ts">
defineProps<{
  loading: boolean;
  error: string | null;
}>();
</script>

<template>
  <div v-if="loading" class="glass-card p-6 text-center">
    <p class="text-sm uppercase tracking-[0.3em] text-text/60">Loading data</p>
    <p class="mt-3 text-lg font-semibold">Fetching burgers and episodes...</p>
  </div>
  <div v-else-if="error" class="glass-card p-6 text-center">
    <p class="text-sm uppercase tracking-[0.3em] text-text/60">Data error</p>
    <p class="mt-3 text-lg font-semibold">{{ error }}</p>
  </div>
</template>
