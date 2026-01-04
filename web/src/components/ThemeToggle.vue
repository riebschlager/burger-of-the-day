<script setup lang="ts">
import { useTheme } from "../composables/useTheme";

const { theme, resolvedTheme, setTheme } = useTheme();

const options = [
  { label: "Light", value: "light" },
  { label: "System", value: "system" },
  { label: "Dark", value: "dark" },
] as const;

const isActive = (value: string) => theme.value === value;
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-xs uppercase tracking-[0.2em] text-text/70">
      {{ resolvedTheme === "dark" ? "Night" : "Day" }} mode
    </span>
    <div
      class="flex items-center rounded-full border border-white/15 bg-muted/70 p-1"
      role="radiogroup"
      aria-label="Theme"
    >
      <button
        v-for="option in options"
        :key="option.value"
        class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest transition"
        :class="
          isActive(option.value)
            ? 'bg-accent text-black'
            : 'text-text/70 hover:text-text'
        "
        type="button"
        role="radio"
        :aria-checked="isActive(option.value)"
        @click="setTheme(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
