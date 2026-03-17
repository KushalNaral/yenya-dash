import { ref, computed, type Ref, type ComputedRef } from "vue";
import type { WizardStep, WizardFormConfig } from "@/components/builders/WizardForm.vue";
import { useWizardFormStore } from "@/stores/wizardForm";

export interface UseWizardFormOptions {
  storageKey?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  allowStepNavigation?: boolean;
}

export function useWizardForm<T extends Record<string, any>>(
  steps: WizardStep[] | ComputedRef<WizardStep[]>,
  initialData?: Ref<T> | T,
  options?: UseWizardFormOptions,
) {
  const defaultOptions: UseWizardFormOptions = {
    autoSave: true,
    autoSaveInterval: 30000,
    allowStepNavigation: true,
    ...options,
  };

  const wizardFormStore = useWizardFormStore();

  const formData = ref<T>(
    (initialData && "value" in initialData ? initialData.value : initialData) || ({} as T),
  );

  const wizardConfig = computed<WizardFormConfig>(() => ({
    steps: "value" in steps ? steps.value : steps,
    initialValues: formData.value,
    autoSave: defaultOptions.autoSave,
    autoSaveInterval: defaultOptions.autoSaveInterval,
    storageKey: defaultOptions.storageKey,
    allowStepNavigation: defaultOptions.allowStepNavigation,
    showProgress: true,
  }));

  const updateFormData = (data: Partial<T>) => {
    formData.value = { ...formData.value, ...data };
  };

  const resetForm = () => {
    formData.value = {} as T;
    if (defaultOptions.storageKey) {
      wizardFormStore.clearDraft(defaultOptions.storageKey);
    }
  };

  return {
    wizardConfig,
    formData,
    updateFormData,
    resetForm,
  };
}
