import { defineStore } from "pinia";
import { ref, computed } from "vue";
import encryption from "@/helpers/Encryption";

export interface WizardFormDraft {
  formId: string;
  formData: Record<string, any>;
  currentStep: number;
  completedSteps: number[];
  lastSaved: Date;
}

export const useWizardFormStore = defineStore(
  "wizardForm",
  () => {
    const drafts = ref<Record<string, WizardFormDraft>>({});

    /**
     * Get draft for a specific form
     */
    const getDraft = (formId: string): WizardFormDraft | null => {
      return drafts.value[formId] || null;
    };

    /**
     * Save draft for a form
     */
    const saveDraft = (
      formId: string,
      formData: Record<string, any>,
      currentStep: number = 0,
      completedSteps: number[] = [],
    ): void => {
      drafts.value[formId] = {
        formId,
        formData,
        currentStep,
        completedSteps,
        lastSaved: new Date(),
      };
    };

    /**
     * Update form data for a draft
     * Only updates fields that are explicitly provided (not undefined)
     * This preserves metadata fields that aren't part of form fields
     */
    const updateFormData = (formId: string, formData: Record<string, any>): void => {
      const draft = drafts.value[formId];
      if (draft) {
        // Filter out undefined values to prevent overwriting existing data
        // This preserves metadata (like case_id) that isn't in form fields
        const definedData = Object.entries(formData).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, any>,
        );

        draft.formData = { ...draft.formData, ...definedData };
        draft.lastSaved = new Date();
      } else {
        saveDraft(formId, formData);
      }
    };

    /**
     * Update current step for a draft
     */
    const updateCurrentStep = (formId: string, step: number): void => {
      const draft = drafts.value[formId];
      if (draft) {
        draft.currentStep = step;
        draft.lastSaved = new Date();
      }
    };

    /**
     * Mark step as completed
     */
    const markStepCompleted = (formId: string, step: number): void => {
      const draft = drafts.value[formId];
      if (draft) {
        if (!draft.completedSteps.includes(step)) {
          draft.completedSteps.push(step);
          draft.lastSaved = new Date();
        }
      }
    };

    /**
     * Clear draft for a form
     */
    const clearDraft = (formId: string): void => {
      delete drafts.value[formId];
    };

    /**
     * Clear all drafts
     */
    const clearAllDrafts = (): void => {
      drafts.value = {};
    };

    /**
     * Get all draft form IDs
     */
    const getDraftFormIds = computed(() => {
      return Object.keys(drafts.value);
    });

    /**
     * Check if draft exists for a form
     */
    const hasDraft = (formId: string): boolean => {
      return formId in drafts.value;
    };

    /**
     * Get draft age (time since last saved)
     */
    const getDraftAge = (formId: string): number | null => {
      const draft = drafts.value[formId];
      if (!draft) return null;
      return Date.now() - draft.lastSaved.getTime();
    };

    const getStoredCaseId = (formId: string): string | null => {
      const draft = drafts.value[formId];
      if (!draft) return null;
      return draft.formData?.master_id || null;
    };

    return {
      drafts,
      getDraft,
      saveDraft,
      updateFormData,
      updateCurrentStep,
      markStepCompleted,
      clearDraft,
      clearAllDrafts,
      getDraftFormIds,
      hasDraft,
      getDraftAge,
      getStoredCaseId,
    };
  },
  {
    persist: {
      storage: localStorage as Storage,
      serializer: {
        deserialize: (encryptedState: string) => {
          try {
            const decrypted = encryption.decrypt(encryptedState);
            const parsed = JSON.parse(decrypted);
            Object.keys(parsed.drafts || {}).forEach((formId) => {
              const draft = parsed.drafts[formId];
              if (draft && draft.lastSaved) {
                draft.lastSaved = new Date(draft.lastSaved);
              }
            });
            return parsed;
          } catch (error) {
            console.error("Failed to deserialize wizard form store:", error);
            return { drafts: {} };
          }
        },
        serialize: (state: unknown) => {
          try {
            return encryption.encrypt(JSON.stringify(state));
          } catch (error) {
            console.error("Failed to serialize wizard form store:", error);
            return encryption.encrypt(JSON.stringify({ drafts: {} }));
          }
        },
      },
      key: "wizardForm",
      pick: ["drafts"],
    },
  },
);
