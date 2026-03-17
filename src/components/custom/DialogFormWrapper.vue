<script setup lang="ts">
import { defineCustomElement } from "vue";
import {
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  editTag?: boolean;
  mode?: "form" | "upload";
}>();

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "cancel"): void;
}>();
</script>

<template>
  <DialogContent
    class="sm:max-w-[1000px] max-w-[90vw] rounded-2xl p-6 bg-background shadow-lg"
    role="dialog"
    aria-modal="true"
    aria-labelledby="tag-dialog-title"
    aria-describedby="tag-dialog-description"
  >
    <DialogHeader>
      <DialogTitle id="tag-dialog-title" class="text-xl font-semibold">
        <template v-if="props.mode === 'upload'">Upload Excel</template>
        <template v-else>{{ props.editTag ? "Edit" : "Create" }}</template>
      </DialogTitle>
      <DialogDescription id="tag-dialog-description" class="text-sm text-muted-foreground">
        <template v-if="props.mode === 'upload'"> Select an Excel file to upload data. </template>
        <template v-else>
          {{
            props.editTag
              ? "Update the item details below."
              : "Fill out the details to add a new item."
          }}
        </template>
      </DialogDescription>
    </DialogHeader>
    <slot />
    <DialogFooter class="mt-6">
      <Button variant="outline" @click="emit('cancel')" class="py-2 rounded-md"> Cancel </Button>
      <!-- Button for form mode -->
      <Button
        v-if="props.mode !== 'upload'"
        type="submit"
        form="ribbon-form"
        class="py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {{ props.editTag ? "Update" : "Create" }}
      </Button>

      <!-- Button for upload mode -->
      <Button
        v-else
        @click="$emit('submit')"
        class="py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Upload
      </Button>
    </DialogFooter>
  </DialogContent>
</template>

<script lang="ts">
export default defineCustomElement({});
</script>
