<script setup lang="ts">
import { useLoadingStore } from "@/stores/loading";
const loadingStore = useLoadingStore();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="loadingStore.isGlobalLoading"
      class="overlay"
      role="status"
      aria-live="polite"
    >
      <div class="grid place-items-center gap-4 p-4">
        <div class="loading">
          <svg width="140" height="110" viewBox="0 0 64 48" aria-hidden="true">
            <polyline
              points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
              id="back"
            ></polyline>
            <polyline
              points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
              id="front"
            ></polyline>
          </svg>
        </div>
        <div class="flex items-center gap-2">
          <div>
            <p class="text-lg font-bold text-primary dark:text-white">
              YenyaSoft Dashboard
            </p>
          </div>
          <div class="dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <p class="sr-only">Loading</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--primary) 12%, rgba(255, 255, 255, 0.82));
  backdrop-filter: blur(3px);
  z-index: 9999;
}

.logo {
  width: 110px;
  height: auto;
  object-fit: contain;
}

.loading svg polyline {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.loading svg polyline#back {
  fill: none;
  stroke: color-mix(in srgb, var(--primary) 35%, transparent);
}

.loading svg polyline#front {
  fill: none;
  stroke: var(--primary);
  stroke-dasharray: 48, 144;
  stroke-dashoffset: 192;
  animation: dash_682 1.4s linear infinite;
}

@keyframes dash_682 {
  72.5% {
    opacity: 0;
  }

  to {
    stroke-dashoffset: 0;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dots {
  --clr: var(--primary);
  --gap: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--gap);
}

.dots span {
  width: 5px;
  height: 5px;
  border-radius: 100%;
  background-color: var(--clr);
  opacity: 0;
}

.dots span:nth-child(1) {
  animation: fade 1s ease-in-out infinite;
}

.dots span:nth-child(2) {
  animation: fade 1s ease-in-out 0.33s infinite;
}

.dots span:nth-child(3) {
  animation: fade 1s ease-in-out 0.66s infinite;
}

@keyframes fade {
  0%,
  100% {
    opacity: 1;
  }

  60% {
    opacity: 0;
  }
}
</style>
