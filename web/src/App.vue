<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute -left-20 top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl animate-float"
      ></div>
      <div
        class="absolute right-0 top-10 h-72 w-72 rounded-full bg-accent-2/20 blur-3xl animate-float"
        style="animation-delay: -2s"
      ></div>
      <div
        class="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      ></div>
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]"
      ></div>
    </div>

    <AppHeader />

    <main class="relative mx-auto max-w-6xl px-6 py-10">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="relative border-t border-white/10 px-6 py-8 text-sm text-text/60">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <p>Built with love for the punniest burger board in animation.</p>
        <p>
          Data sources: Fandom + TVMaze. Not affiliated with Fox or Disney.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
