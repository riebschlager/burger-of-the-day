<script setup lang="ts">
import { useRoute } from "vue-router";
import ThemeToggle from "./ThemeToggle.vue";

const route = useRoute();

const links = [
  { label: "Home", to: "/" },
  { label: "Burgers", to: "/burgers" },
  { label: "Episodes", to: "/episodes" },
];

const isActive = (path: string) =>
  route.path === path || route.path.startsWith(`${path}/`);
</script>

<template>
  <header class="relative z-10 border-b border-white/10 bg-base/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-4">
      <div class="flex items-center gap-4">
        <router-link
          to="/"
          class="text-xl font-semibold tracking-tight text-text"
        >
          <span class="font-display text-2xl">Burger of the Day</span>
        </router-link>
        <span class="chip">Bob's Burgers data lab</span>
      </div>
      <nav class="flex items-center gap-4 text-sm font-semibold">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-full px-3 py-2 transition"
          :class="isActive(link.to) ? 'bg-accent text-black' : 'text-text/80 hover:text-text'"
        >
          {{ link.label }}
        </router-link>
      </nav>
      <ThemeToggle />
    </div>
  </header>
</template>
