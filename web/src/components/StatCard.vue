<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  note?: string;
}>();
</script>

<template>
  <div class="glass-card p-5">
    <p class="text-xs uppercase tracking-[0.3em] text-text/60">{{ label }}</p>
    <p class="mt-3 text-3xl font-semibold text-text">{{ value }}</p>
    <p v-if="note" class="mt-2 text-sm text-text/70">{{ note }}</p>
  </div>
</template>
