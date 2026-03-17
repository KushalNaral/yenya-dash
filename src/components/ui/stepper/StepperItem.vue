<script lang="ts" setup>
import type { StepperItemProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { StepperItem, useForwardProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  StepperItemProps & {
    class?: HTMLAttributes["class"];
    hasPermission?: boolean;
  }
>();

const delegatedProps = reactiveOmit(props, "class", "hasPermission");

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperItem
    v-slot="slotProps"
    v-bind="forwarded"
    :class="cn('flex items-center gap-2 group data-[disabled]:pointer-events-none', props.class)"
  >
    <slot v-bind="{ ...slotProps, hasPermission: props.hasPermission }" />
  </StepperItem>
</template>
