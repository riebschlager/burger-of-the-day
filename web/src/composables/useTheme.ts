import { computed, onMounted, ref, watch } from "vue";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "botd-theme";
const themeState = ref<ThemeMode>("system");
const systemPrefersDark = ref(false);

function getSystemPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode, prefersDark: boolean) {
  if (typeof document === "undefined") return;
  const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function useTheme() {
  const resolvedTheme = computed(() =>
    themeState.value === "system"
      ? systemPrefersDark.value
        ? "dark"
        : "light"
      : themeState.value
  );

  const setTheme = (mode: ThemeMode) => {
    themeState.value = mode;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
    applyTheme(mode, systemPrefersDark.value);
  };

  onMounted(() => {
    systemPrefersDark.value = getSystemPreference();

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        themeState.value = stored;
      }

      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (event: MediaQueryListEvent) => {
        systemPrefersDark.value = event.matches;
        applyTheme(themeState.value, systemPrefersDark.value);
      };
      media.addEventListener("change", listener);
    }

    applyTheme(themeState.value, systemPrefersDark.value);
  });

  watch(systemPrefersDark, () => {
    applyTheme(themeState.value, systemPrefersDark.value);
  });

  return {
    theme: themeState,
    resolvedTheme,
    setTheme,
  };
}
