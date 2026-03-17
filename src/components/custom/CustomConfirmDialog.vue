<script setup lang="ts">
import { computed } from "vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    open?: boolean;
    deletableTitle?: string;
    deletableDescription?: string;
    mode?: string;
    deleteTitle?: string;
  }>(),
  { mode: "delete" },
);

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "update:open", val: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const isOpen = computed(() => props.modelValue ?? props.open ?? false);

function setOpen(val: boolean) {
  emit("update:modelValue", val);
  emit("update:open", val);
}

const titlePrefix = computed(() => {
  const mode = props.mode ?? "delete";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
});

const confirmLabel = computed(() => {
  if (props.deleteTitle) return props.deleteTitle;
  const mode = props.mode ?? "delete";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
});

function close() {
  setOpen(false);
  emit("cancel");
}

function confirm() {
  emit("confirm");
  setOpen(false);
}
</script>

<template>
  <AlertDialog :open="isOpen" @update:open="setOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle
          >{{ titlePrefix }} "{{
            deletableTitle ?? "entity"
          }}"</AlertDialogTitle
        >
        <AlertDialogDescription>
          {{
            deletableDescription ??
            "This action cannot be undone. This will permanently delete the entity and remove its data."
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel class="cursor-pointer" @click="close">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          :class="
            mode === 'delete'
              ? 'bg-destructive hover:bg-destructive/[0.8]'
              : 'bg-primary hover:bg-primary/[0.8]'
          "
          @click="confirm"
        >
          {{ confirmLabel }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
