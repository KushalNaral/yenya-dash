<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  deletableTitle?: string;
  deletableDescription?: string;
  mode: string;
  deleteTitle?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function close() {
  emit("update:modelValue", false);
  emit("cancel");
}

function confirm() {
  emit("confirm");
  emit("update:modelValue", false);
}
</script>

<template>
  <AlertDialog :open="modelValue" @update:open="(val) => emit('update:modelValue', val)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle
          >{{ mode === "delete" ? "Delete" : "" }} "{{
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
        <AlertDialogCancel class="cursor-pointer" @click="close"> Cancel </AlertDialogCancel>
        <AlertDialogAction
          :class="
            mode === 'delete'
              ? 'bg-destructive hover:bg-destructive/[0.8]'
              : 'bg-primary hover:bg-primary/[0.8]'
          "
          @click="confirm"
        >
          {{ mode === "delete" ? "Delete" : deleteTitle }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
