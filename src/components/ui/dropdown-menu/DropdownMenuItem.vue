<script setup lang="ts">
import type { DropdownMenuItemProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { DropdownMenuItem, useForwardProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<
    DropdownMenuItemProps & {
      class?: HTMLAttributes["class"];
      inset?: boolean;
      variant?: "default" | "destructive" | "secondary" | "ghost" | "link" | "outline";
    }
  >(),
  {
    variant: "default",
  },
);

const delegatedProps = reactiveOmit(props, "inset", "variant", "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuItem
    data-slot="dropdown-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwardedProps"
    :class="
      cn(
        `focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/40 data-[variant=destructive]:focus:text-destructive-foreground data-[variant=destructive]:*:[svg]:!text-destructive-foreground data-[variant=secondary]:text-secondary-foreground data-[variant=secondary]:focus:bg-secondary/10 dark:data-[variant=secondary]:focus:bg-secondary/40 data-[variant=secondary]:focus:text-secondary-foreground data-[variant=secondary]:*:[svg]:!text-secondary-foreground data-[variant=ghost]:text-ghost-foreground data-[variant=ghost]:focus:bg-ghost/10 dark:data-[variant=ghost]:focus:bg-ghost/40 data-[variant=ghost]:focus:text-ghost-foreground data-[variant=ghost]:*:[svg]:!text-ghost-foreground data-[variant=link]:text-link-foreground data-[variant=link]:focus:bg-link/10 dark:data-[variant=link]:focus:bg-link/40 data-[variant=link]:focus:text-link-foreground data-[variant=link]:*:[svg]:!text-link-foreground data-[variant=outline]:text-outline-foreground data-[variant=outline]:focus:bg-outline/10 dark:data-[variant=outline]:focus:bg-outline/40 data-[variant=outline]:focus:text-outline-foreground data-[variant=outline]:*:[svg]:!text-outline-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
