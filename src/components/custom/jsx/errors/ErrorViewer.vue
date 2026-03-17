<script setup lang="ts">
import { ref, watch, computed } from "vue";

interface FurtherStep {
  label: string;
  action: () => void | Promise<void>;
}

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title?: string;
    message: string;
    furtherSteps?: FurtherStep[];
    autoCloseOnRetry?: boolean;
    showDefaultSteps?: boolean;
  }>(),
  {
    showDefaultSteps: false,
  },
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "retry"): void;
}>();

const isRetrying = ref(false);

async function retry() {
  if (isRetrying.value) return;
  isRetrying.value = true;
  try {
    await emit("retry");
    if (props.autoCloseOnRetry !== false) {
      setTimeout(() => emit("close"), 300);
    }
  } finally {
    setTimeout(() => (isRetrying.value = false), 500);
  }
}

const defaultSteps: FurtherStep[] = props.showDefaultSteps
  ? [{ label: "Retry", action: retry }]
  : [];
const steps = computed(() => (props.furtherSteps?.length ? props.furtherSteps : defaultSteps));

watch(
  () => props.isOpen,
  (open) => {
    if (!open) isRetrying.value = false;
  },
);
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-to-class="opacity-0 translate-y-1 scale-95"
  >
    <div
      v-if="isOpen"
      role="alert"
      aria-live="assertive"
      class="relative mx-auto mt-3 max-w-2xl rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm backdrop-blur-sm dark:border-red-900/50 dark:bg-red-900/10"
    >
      <div class="flex items-start gap-3">
        <Iconify
          icon="line-md:alert-circle-twotone"
          class="mt-0.5 size-5 flex-shrink-0 text-red-600 dark:text-red-400"
        />

        <div class="flex-1 space-y-1.5">
          <p class="font-medium text-red-900 dark:text-red-300">
            {{ title ?? "Error" }}
          </p>

          <p class="text-red-500 dark:text-red-300/90 whitespace-pre-line leading-snug">
            {{ message }}
          </p>

          <div v-if="steps.length" class="flex flex-wrap items-center gap-2 pt-1">
            <Button
              v-for="(step, i) in steps"
              :key="i"
              size="sm"
              @click="step.action"
              :disabled="step.label === 'Retry' && isRetrying"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
              :class="[
                step.label === 'Retry'
                  ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                  : 'bg-white text-red-700 ring-1 ring-red-300 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-700/50 dark:hover:bg-red-900/30',
              ]"
            >
              <Iconify
                v-if="step.label === 'Retry' && isRetrying"
                icon="lucide:loader-circle"
                class="size-3.5 animate-spin"
              />
              {{ isRetrying && step.label === "Retry" ? "Retrying..." : step.label }}
            </Button>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          @click="emit('close')"
          class="absolute right-2 top-2 rounded-full p-1 text-red-500 transition hover:bg-red-100 dark:hover:bg-red-900/20"
          aria-label="Close"
        >
          <Iconify icon="lucide:x" class="size-4" />
        </Button>
      </div>
    </div>
  </Transition>
</template>
