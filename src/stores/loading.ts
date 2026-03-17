import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useLoadingStore = defineStore("loading", () => {
  const activeRequests = ref(0);
  const isGlobalLoading = computed(() => activeRequests.value > 0);

  function startRequest() {
    activeRequests.value += 1;
  }

  function endRequest() {
    activeRequests.value = Math.max(0, activeRequests.value - 1);
  }

  function resetLoading() {
    activeRequests.value = 0;
  }

  return { activeRequests, isGlobalLoading, startRequest, endRequest, resetLoading };
});
