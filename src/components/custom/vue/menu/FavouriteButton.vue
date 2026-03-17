<script setup lang="ts">
import { computed } from "vue";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  url: String,
  isFavourite: Boolean,
  size: {
    type: String as () => "default" | "sm",
    default: "default",
  },
});

const authStore = useAuthStore();

const sizeClasses = computed(() => (props.size === "sm" ? "h-3 w-3" : "h-4 w-4"));
const containerClasses = computed(() => (props.size === "sm" ? "p-0.5" : "p-1"));

function toggleFavourite(e: Event) {
  e.stopPropagation();
  e.preventDefault();
  authStore.toggleFavourite(props.url);
}
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          :class="`opacity-0 group-hover:opacity-100 rounded-md hover:bg-muted/80 transition-all duration-300 group-data-[collapsible=icon]:opacity-100 ${containerClasses}`"
          @click="toggleFavourite"
          :aria-label="isFavourite ? 'Remove favourite' : 'Add favourite'"
        >
          <Star
            :class="`${sizeClasses} transition-all duration-300 ${isFavourite ? 'text-yellow-500 fill-current scale-110' : 'text-muted-foreground hover:text-yellow-500 hover:scale-110'}`"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{{ isFavourite ? "Remove from favourites" : "Add to favourites" }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
