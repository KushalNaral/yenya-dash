<script setup lang="ts">
import { computed } from "vue";
import FormBuilder from "@/components/builders/FormBuilder.vue";
import type { FormConfig } from "@/types/form";

interface Props {
  open: boolean;
  mode?: "create" | "edit" | "upload";
  title?: string;
  description?: string;
  formConfig: FormConfig;
  editData?: Record<string, any> | null;
  loading?: boolean;
  formId?: string;
  serverErrors?: Record<string, string[]>;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "create",
  loading: false,
  formId: "dynamic-form",
  serverErrors: () => ({}) as Record<string, string[]>,
});

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "submit", data: Record<string, any>): void;
  (e: "cancel"): void;
  (e: "field-update", data: Record<string, any>): void;
}>();

const mergedFormConfig = computed(() => {
  const config = { ...props.formConfig };
  if (props.editData && (!config.initialValues || Object.keys(config.initialValues).length === 0)) {
    config.initialValues = props.editData;
  }
  return config;
});

const dialogTitle = computed(() => {
  if (props.title) return props.title;
  if (props.mode === "upload") return "Upload Excel";
  if (props.mode === "edit") return "Edit Item";
  return "Create New Item";
});

const dialogDescription = computed(() => {
  if (props.description) return props.description;
  if (props.mode === "upload") return "Select an Excel file to upload data.";
  if (props.mode === "edit") return "Update the item details below.";
  return "Fill out the details to add a new item.";
});

const submitLabel = computed(() => {
  if (props.mode === "upload") return "Upload";
  if (props.mode === "edit") return "Update";
  return "Create";
});

const handleClose = () => {
  emit("update:open", false);
  emit("cancel");
};

const handleSubmit = (data: Record<string, any>) => {
  emit("submit", data);
};

const handleReset = () => {};
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent
      class="sm:max-w-5xl max-w-[calc(100%-2rem)] rounded-xl p-0 bg-background backdrop-blur-md border border-border/40 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style="max-height: 85vh"
    >
      <DialogHeader
        class="shrink-0 px-6 py-5 border-b border-border/20 bg-gradient-to-r from-accent/50 to-transparent"
      >
        <DialogTitle class="text-2xl font-bold tracking-tight text-foreground">
          {{ dialogTitle }}
        </DialogTitle>
        <DialogDescription class="text-sm text-muted-foreground/80 mt-2">
          {{ dialogDescription }}
        </DialogDescription>
      </DialogHeader>

      <div
        class="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent"
      >
        <slot>
          <FormBuilder
            v-if="props.open"
            :config="mergedFormConfig"
            :mode="props.mode === 'create' || props.mode === 'upload' ? 'edit' : props.mode"
            :loading="props.loading"
            :formId="props.formId"
            :external-errors="props.serverErrors"
            @form-submit="handleSubmit"
            @update="$emit('field-update', $event)"
            @reset="handleReset"
          />
        </slot>
      </div>

      <DialogFooter
        class="shrink-0 z-10 px-6 py-4 bg-gradient-to-r from-accent/50 to-transparent border-t border-border/20 backdrop-blur-sm gap-3 flex justify-end"
      >
        <Button
          variant="outline"
          @click="handleClose"
          class="py-2.5 px-5 rounded-lg border-border/50 hover:bg-muted hover:border-border transition-all duration-200 font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :form="props.formId"
          class="py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-primary/30 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="props.loading"
        >
          <span v-if="props.loading" class="flex items-center gap-2">
            <Iconify icon="mdi:loading" class="h-4 w-4 animate-spin" />
            Saving...
          </span>
          <span v-else>{{ submitLabel }}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
