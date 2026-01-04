import { ref } from "vue";
import type { BurgerDataBundle } from "../lib/data";
import { loadBurgerData } from "../lib/data";

const dataState = ref<BurgerDataBundle | null>(null);
const loadingState = ref(false);
const errorState = ref<string | null>(null);

export async function ensureBurgerData(): Promise<BurgerDataBundle | null> {
  if (dataState.value) return dataState.value;
  if (loadingState.value) return dataState.value;

  loadingState.value = true;
  errorState.value = null;

  try {
    dataState.value = await loadBurgerData();
  } catch (error) {
    errorState.value = error instanceof Error ? error.message : String(error);
  } finally {
    loadingState.value = false;
  }

  return dataState.value;
}

export function useBurgerData() {
  return {
    data: dataState,
    loading: loadingState,
    error: errorState,
    refresh: ensureBurgerData,
  };
}
