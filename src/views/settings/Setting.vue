<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto p-6">
      <header class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-foreground tracking-tight">Website Settings</h1>
          <p class="text-muted-foreground mt-2 text-sm">
            Manage website configuration, contact information, and social media links
          </p>
        </div>
      </header>

      <div v-if="isLoading && !currentSetting" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
        <span class="ml-3 text-muted-foreground text-lg">Loading settings...</span>
      </div>

      <div v-else class="bg-card rounded-lg shadow-md p-6">
        <FormBuilder
          :config="formConfig"
          mode="edit"
          :loading="isSaving"
          :external-errors="errors"
          formId="settings-form"
          @form-submit="handleSubmit"
        />

        <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <Button
            type="submit"
            form="settings-form"
            :disabled="isSaving"
            class="py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-primary/30 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSaving" class="flex items-center gap-2">
              <Iconify icon="mdi:loading" class="h-4 w-4 animate-spin" />
              Saving...
            </span>
            <span v-else>{{ currentSetting ? "Update Settings" : "Save Settings" }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { settingService } from "@/services/settingService";
import { useSettingForm } from "@/composables/useSettingForm";
import FormBuilder from "@/components/builders/FormBuilder.vue";
import { useToast } from "@/composables/useToast";
import type { Setting, CreateSettingData, UpdateSettingData } from "@/types/settings/setting";

const { showToast } = useToast();
const currentSetting = ref<Setting | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const errors = ref<Record<string, string[]>>({});

const { formConfig } = useSettingForm(currentSetting);

onMounted(async () => {
  await loadSettings();
});

const loadSettings = async () => {
  isLoading.value = true;
  try {
    const settings = await settingService.getAll();
    if (settings && settings.length > 0) {
      const sorted = [...settings].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      currentSetting.value = sorted[0];
    } else {
      currentSetting.value = null;
    }
    errors.value = {};
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
    console.error("Failed to load settings:", err);
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async (data: CreateSettingData | UpdateSettingData) => {
  isSaving.value = true;
  try {
    if (currentSetting.value && currentSetting.value.id) {
      await settingService.update(currentSetting.value.id, data);
      showToast("Settings updated successfully", "success");
    } else {
      const newSetting = await settingService.create(data as CreateSettingData);
      currentSetting.value = newSetting as Setting;
      showToast("Settings created successfully", "success");
    }
    errors.value = {};
    await loadSettings();
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
    showToast(err.message || "Failed to save settings", "internal_error");
  } finally {
    isSaving.value = false;
  }
};
</script>
