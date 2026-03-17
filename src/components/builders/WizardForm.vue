<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import FormBuilder, { type FormConfig } from "./FormBuilder.vue";
import { useAuthStore } from "@/stores/auth";
import { useWizardFormStore } from "@/stores/wizardForm";
import { toISODateString } from "@/lib/utils";
import { StepperTitle } from "reka-ui";
import { useToast } from "@/composables/useToast";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields: FormConfig["fields"];
  validation?: (data: Record<string, any>) => boolean | string;
  component?: any;
  componentProps?: Record<string, any>;
  permission?: string;
  permissions?: string[];
  requireAllPermissions?: boolean;
  condition?: (data: Record<string, any>) => boolean;
  subSteps?: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
    fields: FormConfig["fields"];
    validation?: (data: Record<string, any>) => boolean | string;
    component?: any;
    componentProps?: Record<string, any>;
    permission?: string;
    permissions?: string[];
    requireAllPermissions?: boolean;
    condition?: (data: Record<string, any>) => boolean;
  }>;
}

export interface WizardFormConfig {
  steps: WizardStep[];
  initialValues?: Record<string, any>;
  title?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  storageKey?: string;
  showProgress?: boolean;
  allowStepNavigation?: boolean;
  nextButtonLabel?: string;
  onBeforeNext?: (stepIndex: number, data: Record<string, any>) => Promise<void | boolean>;
}

const props = withDefaults(defineProps<WizardFormConfig>(), {
  autoSave: true,
  autoSaveInterval: 30000,
  showProgress: true,
  allowStepNavigation: true,
});

const emit = defineEmits<{
  "step-change": [step: number];
  "form-update": [data: Record<string, any>];
  "step-submit": [step: number, data: Record<string, any>];
  "form-submit": [step: number, data: Record<string, any>];
  "draft-save": [data: Record<string, any>];
  "permission-denied": [step: number, requiredPermission: string | string[]];
}>();

const authStore = useAuthStore();
const wizardFormStore = useWizardFormStore();
const { showErrorToast } = useToast();
const currentStep = ref(0);
const currentSubStepIndex = ref<Record<number, number>>({});
const formData = ref<Record<string, any>>(
  (props.initialValues as Record<string, any> | undefined) ?? {},
);
const stepErrors = ref<Record<number, Record<string, string>>>({});
const subStepErrors = ref<Record<number, Record<number, Record<string, string>>>>({});
const isSaving = ref(false);
const isSubmitting = ref(false);
const isProcessingStep = ref(false);
const completedSteps = ref<Set<number>>(new Set());
const autoSaveTimer = ref<number | null>(null);
const saveDraftDebounceTimer = ref<number | null>(null);
const permissionDeniedStep = ref<number | null>(null);

const formId = computed(() => props.storageKey || `wizard-form-${Date.now()}`);

const getFirstAccessibleSubIndex = (stepIndex: number): number => {
  const indices = accessibleSubSteps(stepIndex);
  return indices.length ? indices[0] : 0;
};

const getActiveSubIndex = (stepIndex: number): number => {
  // return chosen index (default 0) without changing it based on permissions
  return currentSubStepIndex.value[stepIndex] ?? 0;
};

// Main step fields only (no sub-step fields)
const mainStepOnlyConfig = computed((): FormConfig => {
  const step = props.steps[currentStep.value];
  const fields = step?.fields || [];

  const initialValues: Record<string, any> = { ...formData.value };
  fields.forEach((field) => {
    if (field.type === "date" && field.name in initialValues && initialValues[field.name]) {
      const dateValue = initialValues[field.name];
      if (typeof dateValue === "string") {
        initialValues[field.name] = new Date(dateValue);
      }
    }
  });

  return {
    fields,
    initialValues,
    layout: "grid",
    columns: 3,
    showSubmit: false,
  };
});

// Active sub-step fields only
const subStepOnlyConfig = computed((): FormConfig => {
  const step = props.steps[currentStep.value];
  if (!step?.subSteps?.length) {
    return {
      fields: [],
      initialValues: formData.value,
      layout: "grid",
      columns: 3,
      showSubmit: false,
      title: "",
    };
  }

  const subIndex = getActiveSubIndex(currentStep.value);
  if (!hasSubStepPermission(step, subIndex)) {
    return {
      fields: [],
      initialValues: formData.value,
      layout: "grid",
      columns: 3,
      showSubmit: false,
    };
  }

  const fields = step.subSteps[subIndex]?.fields || [];
  const initialValues: Record<string, any> = { ...formData.value };

  fields.forEach((field) => {
    if (field.type === "date" && field.name in initialValues && initialValues[field.name]) {
      const dateValue = initialValues[field.name];
      if (typeof dateValue === "string") {
        initialValues[field.name] = new Date(dateValue);
      }
    }
  });

  return {
    fields,
    initialValues,
    layout: "grid",
    columns: 3,
    showSubmit: false,
  };
});

const progressPercentage = computed(() => {
  return Math.round(((currentStep.value + 1) / props.steps.length) * 100);
});

const isLastStep = computed(() => currentStep.value === props.steps.length - 1);

const isFirstStep = computed(() => currentStep.value === 0);

const canGoNext = computed(() => {
  return isCurrentStepValid.value && !isLastStep.value;
});

const isCurrentStepValid = computed(() => {
  const errors = stepErrors.value[currentStep.value];
  return !errors || Object.keys(errors).length === 0;
});

const hasStepPermission = (step: WizardStep): boolean => {
  if (step.condition && !step.condition(formData.value)) {
    return false;
  }

  if (!step.permission && !step.permissions) {
    return true;
  }

  if (step.permission) {
    return authStore.hasPermission(step.permission);
  }

  if (step.permissions && step.permissions.length > 0) {
    if (step.requireAllPermissions) {
      return authStore.hasAllPermissions(step.permissions);
    }
    return authStore.hasAnyPermission(step.permissions);
  }

  return true;
};

const hasSubStepPermission = (step: WizardStep, subIndex: number): boolean => {
  const sub = step.subSteps?.[subIndex];
  if (!sub) return true;

  if (sub.condition && !sub.condition(formData.value)) {
    return false;
  }

  if (!sub.permission && !sub.permissions) return true;
  if (sub.permission) return authStore.hasPermission(sub.permission);
  if (sub.permissions && sub.permissions.length > 0) {
    if (sub.requireAllPermissions) return authStore.hasAllPermissions(sub.permissions);
    return authStore.hasAnyPermission(sub.permissions);
  }
  return true;
};

const accessibleSteps = computed(() => {
  return props.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => hasStepPermission(step))
    .map(({ index }) => index);
});

const accessibleSubSteps = (stepIndex: number): number[] => {
  const step = props.steps[stepIndex];
  if (!step?.subSteps?.length) return [];
  return step.subSteps
    .map((s, idx) => ({ s, idx }))
    .filter(({ idx }) => hasSubStepPermission(step, idx))
    .map(({ idx }) => idx);
};

const isCurrentStepAccessible = computed(() => {
  const step = props.steps[currentStep.value];
  return step ? hasStepPermission(step) : false;
});

const isCurrentSubStepAccessible = computed(() => {
  const step = props.steps[currentStep.value];
  if (!step?.subSteps?.length) return true;
  const idx = getActiveSubIndex(currentStep.value);
  return hasSubStepPermission(step, idx);
});

const getNextAccessibleStep = (fromStep: number): number | null => {
  for (let i = fromStep + 1; i < props.steps.length; i++) {
    if (hasStepPermission(props.steps[i])) {
      return i;
    }
  }
  return null;
};

const getPreviousAccessibleStep = (fromStep: number): number | null => {
  for (let i = fromStep - 1; i >= 0; i--) {
    if (hasStepPermission(props.steps[i])) {
      return i;
    }
  }
  return null;
};

const validateStep = (stepIndex: number): boolean => {
  const step = props.steps[stepIndex];
  if (!step) return false;

  const errors: Record<string, string> = {};

  const isFieldVisible = (field: any, data: Record<string, any>): boolean => {
    const cond = field.showIf;
    if (!cond) return true;

    const conditions = Array.isArray(cond) ? cond : [cond];
    return conditions.every((c: any) => {
      const val = data[c.field];

      switch (c.operator) {
        case "equals":
          return val === c.value;
        case "notEquals":
          return val !== c.value;
        case "in":
          return Array.isArray(c.values) && c.values.includes(val);
        case "notIn":
          return Array.isArray(c.values) && !c.values.includes(val);
        case "true":
          return !!val;
        case "false":
          return !val;
        default:
          return true;
      }
    });
  };

  // Choose fields to validate: main step fields + current sub-step fields (if any)
  const subIndex = currentSubStepIndex.value[stepIndex] || 0;
  const mainFields = step.fields || [];
  const subStepFields =
    step.subSteps && step.subSteps.length ? step.subSteps[subIndex]?.fields || [] : [];
  const fieldsToValidate = [...mainFields, ...subStepFields];

  fieldsToValidate.forEach((field) => {
    const visible = isFieldVisible(field, formData.value);
    const value = formData.value[field.name];

    // Skip validation when the field is hidden by showIf
    if (!visible) {
      return;
    }

    if (field.required) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && !value.length)
      ) {
        errors[field.name] = `${field.label} is required`;
      }
    }

    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = "Invalid email format";
    }

    if (field.type === "date" && value) {
      let dateValue: Date | null = null;

      if (value instanceof Date) {
        dateValue = value;
      } else if (typeof value === "string") {
        dateValue = new Date(value);
      } else if (typeof value === "number") {
        dateValue = new Date(value);
      }

      if (dateValue && (isNaN(dateValue.getTime()) || !dateValue.getTime())) {
        errors[field.name] = `${field.label} must be a valid date`;
      }
    }

    if (field.validator) {
      const customValidation = field.validator(value);
      if (customValidation !== true && typeof customValidation === "string") {
        errors[field.name] = customValidation;
      }
    }

    if (field.type === "select" && value && field.options) {
      const validOptions = field.options.map((opt) => opt.value);
      if (!validOptions.includes(value)) {
        errors[field.name] = `Invalid selection for ${field.label}`;
      }
    }

    if (["multi-select", "tree-select"].includes(field.type) && value && field.options) {
      const flattenOptions = (opts: any[]): any[] => {
        return opts.reduce((acc: any[], opt: any) => {
          acc.push(opt);
          if (opt.children) {
            acc.push(...flattenOptions(opt.children));
          }
          return acc;
        }, []);
      };

      const validOptions = flattenOptions(field.options).map((opt) => opt.value);
      const values = Array.isArray(value) ? value : [value];
      const invalidValues = values.filter((val) => val && !validOptions.includes(val));

      if (invalidValues.length > 0) {
        errors[field.name] = `Invalid selection(s) for ${field.label}`;
      }
    }
  });

  if (step.subSteps && step.subSteps.length) {
    const sub = step.subSteps[subIndex];
    if (sub?.validation) {
      const validationResult = sub.validation(formData.value);
      if (validationResult !== true && typeof validationResult === "string") {
        (fieldsToValidate || []).forEach((f) => {
          errors[f.name] = validationResult as string;
        });
      }
    }
  } else if (step.validation) {
    const validationResult = step.validation(formData.value);
    if (validationResult !== true) {
      if (typeof validationResult === "string") {
        step.fields.forEach((f) => {
          errors[f.name] = validationResult;
        });
      }
    }
  }

  stepErrors.value[stepIndex] = errors;
  if (props.steps[stepIndex]?.subSteps?.length) {
    subStepErrors.value[stepIndex] = subStepErrors.value[stepIndex] || {};
    subStepErrors.value[stepIndex]![subIndex] = errors;
  }
  return Object.keys(errors).length === 0;
};

const goToSubStep = (stepIndex: number, subIndex: number) => {
  const step = props.steps[stepIndex];
  if (step && !hasSubStepPermission(step, subIndex)) {
    emit(
      "permission-denied",
      stepIndex,
      step.subSteps?.[subIndex]?.permission || step.subSteps?.[subIndex]?.permissions || [],
    );
    return;
  }
  currentSubStepIndex.value[stepIndex] = subIndex;
  validateStep(stepIndex);
};

const goToStep = (stepIndex: number) => {
  // If step navigation is disabled, only allow going to the immediate next step
  // (for automatic progression after save), but prevent jumping ahead manually
  if (!props.allowStepNavigation && stepIndex > currentStep.value + 1) {
    return;
  }

  const targetStep = props.steps[stepIndex];
  if (targetStep && !hasStepPermission(targetStep)) {
    permissionDeniedStep.value = stepIndex;
    emit("permission-denied", stepIndex, targetStep.permission || targetStep.permissions || []);
    return;
  }

  if (stepIndex > currentStep.value && !validateStep(currentStep.value)) {
    const errors = stepErrors.value[currentStep.value];
    const requiredFields: string[] = [];
    const otherErrors: string[] = [];

    Object.entries(errors).forEach(([fieldName, errorMessage]) => {
      const field = props.steps[currentStep.value]?.fields.find((f) => f.name === fieldName);
      if (field && errorMessage.includes("required")) {
        requiredFields.push(field.label);
      } else {
        otherErrors.push(errorMessage);
      }
    });

    let errorMessage = "Please fill in all required fields before proceeding.";
    if (requiredFields.length > 0) {
      errorMessage += `\n\nRequired fields:\n${requiredFields.map((f) => `• ${f}`).join("\n")}`;
    }
    if (otherErrors.length > 0) {
      errorMessage += `\n\nOther errors:\n${otherErrors.map((e) => `• ${e}`).join("\n")}`;
    }

    showErrorToast({
      title: "Validation Error",
      message: errorMessage,
      duration: 5000,
    });
    return;
  }

  permissionDeniedStep.value = null;
  currentStep.value = stepIndex;

  if (props.storageKey) {
    wizardFormStore.updateCurrentStep(formId.value, stepIndex);
  }

  emit("step-change", stepIndex);
};

const goToNextStep = async () => {
  const step = props.steps[currentStep.value];
  const subIndices = accessibleSubSteps(currentStep.value);
  const hasSubs = !!step?.subSteps?.length && subIndices.length > 0;
  const currentSub = currentSubStepIndex.value[currentStep.value] || 0;

  if (validateStep(currentStep.value)) {
    // If sub-steps exist, move within sub-steps first
    if (hasSubs && currentSub < Math.max(...subIndices)) {
      // Find next accessible sub step
      const nextSub = subIndices.find((i) => i > currentSub);
      if (nextSub !== undefined) {
        goToSubStep(currentStep.value, nextSub);
        return;
      }
    }

    if (props.onBeforeNext) {
      try {
        isProcessingStep.value = true;
        const shouldContinue = await props.onBeforeNext(currentStep.value, formData.value);
        if (shouldContinue === false) {
          return;
        }
      } catch (error: any) {
        console.error("Step submission failed:", error);
        return;
      } finally {
        isProcessingStep.value = false;
      }
    } else {
      emit("step-submit", currentStep.value, formData.value);
    }

    if (hasStepPermission(step)) {
      completedSteps.value.add(currentStep.value);

      if (props.storageKey) {
        wizardFormStore.markStepCompleted(formId.value, currentStep.value);
      }
    }

    const nextStep = getNextAccessibleStep(currentStep.value);
    if (nextStep !== null) {
      goToStep(nextStep);
    } else if (currentStep.value < props.steps.length - 1) {
      goToStep(currentStep.value + 1);
    }
  } else {
    const errors = stepErrors.value[currentStep.value];
    const requiredFields: string[] = [];
    const otherErrors: string[] = [];

    Object.entries(errors).forEach(([fieldName, errorMessage]) => {
      const step = props.steps[currentStep.value];
      const subIndex = currentSubStepIndex.value[currentStep.value] || 0;
      const fields =
        step?.subSteps && step.subSteps.length
          ? step.subSteps[subIndex]?.fields || []
          : step?.fields || [];
      const field = fields.find((f) => f.name === fieldName);
      if (field && errorMessage.includes("required")) {
        requiredFields.push(field.label);
      } else {
        otherErrors.push(errorMessage);
      }
    });

    let errorMessage = "Please fill in all required fields before proceeding.";
    if (requiredFields.length > 0) {
      errorMessage += `\n\nRequired fields:\n${requiredFields.map((f) => `• ${f}`).join("\n")}`;
    }
    if (otherErrors.length > 0) {
      errorMessage += `\n\nOther errors:\n${otherErrors.map((e) => `• ${e}`).join("\n")}`;
    }

    showErrorToast({
      title: "Validation Error",
      message: errorMessage,
      duration: 5000,
    });
  }
};

const goToPreviousStep = () => {
  const step = props.steps[currentStep.value];
  const subIndices = accessibleSubSteps(currentStep.value);
  const hasSubs = !!step?.subSteps?.length && subIndices.length > 0;
  const currentSub = currentSubStepIndex.value[currentStep.value] || 0;

  if (hasSubs && currentSub > Math.min(...subIndices)) {
    // Move to previous accessible sub-step
    const reversed = [...subIndices].reverse();
    const prevSub = reversed.find((i) => i < currentSub);
    if (prevSub !== undefined) {
      goToSubStep(currentStep.value, prevSub);
      return;
    }
  }

  const prevStep = getPreviousAccessibleStep(currentStep.value);
  if (prevStep !== null) {
    goToStep(prevStep);
  } else if (currentStep.value > 0) {
    goToStep(currentStep.value - 1);
  }
};

const handleFormUpdate = (data: Record<string, any>) => {
  formData.value = { ...formData.value, ...data };
  emit("form-update", formData.value);

  validateStep(currentStep.value);

  if (props.storageKey) {
    const step = props.steps[currentStep.value];
    const normalized: Record<string, any> = { ...formData.value };
    if (step?.fields?.length) {
      step.fields.forEach((field) => {
        if (field.type === "date" && field.name in normalized) {
          normalized[field.name] = toISODateString(normalized[field.name]);
        }
      });
    }
    const existingDraft = wizardFormStore.getDraft(formId.value);
    if (existingDraft) {
      const criticalFields = ["epid_number", "master_id", "case_id"];
      criticalFields.forEach((field) => {
        if (existingDraft.formData[field] !== undefined) {
          // Always preserve critical fields from store (they come from API responses)
          normalized[field] = existingDraft.formData[field];
        }
      });
    }

    wizardFormStore.updateFormData(formId.value, normalized);
  }

  if (props.autoSave) {
    if (saveDraftDebounceTimer.value) {
      clearTimeout(saveDraftDebounceTimer.value);
      saveDraftDebounceTimer.value = null;
    }
    saveDraftDebounceTimer.value = window.setTimeout(() => {
      saveDraftDebounceTimer.value = null;
      saveDraft(false);
    }, 800);
  }
};

const handleStepSubmit = (data: Record<string, any>) => {
  const step = props.steps[currentStep.value];
  const normalized: Record<string, any> = { ...data };
  if (step?.fields?.length) {
    step.fields.forEach((field) => {
      if (field.type === "date" && field.name in normalized) {
        normalized[field.name] = toISODateString(normalized[field.name]);
      }
    });
  }

  formData.value = { ...formData.value, ...normalized };
  emit("step-submit", currentStep.value, formData.value);
  goToNextStep();
};

const saveDraft = async (notify: boolean = true) => {
  if (!props.storageKey) return;
  try {
    isSaving.value = true;
    const existingDraft = wizardFormStore.getDraft(formId.value);
    let mergedFormData = formData.value;
    if (existingDraft) {
      const criticalFields = ["epid_number", "master_id", "case_id"];
      mergedFormData = { ...formData.value };
      criticalFields.forEach((field) => {
        if (existingDraft.formData[field] !== undefined) {
          mergedFormData[field] = existingDraft.formData[field];
        }
      });
    }
    wizardFormStore.saveDraft(
      formId.value,
      mergedFormData,
      currentStep.value,
      Array.from(completedSteps.value),
    );
    if (notify) {
      emit("draft-save", formData.value);
    }
  } catch (error) {
    console.error("Failed to save draft:", error);
  } finally {
    isSaving.value = false;
  }
};

const loadDraft = () => {
  if (!props.storageKey) return;
  try {
    const draft = wizardFormStore.getDraft(formId.value);
    if (draft) {
      const loadedData: Record<string, any> = { ...draft.formData };
      props.steps.forEach((step) => {
        step.fields.forEach((field) => {
          if (field.type === "date" && field.name in loadedData && loadedData[field.name]) {
            const dateValue = loadedData[field.name];
            if (typeof dateValue === "string") {
              loadedData[field.name] = new Date(dateValue);
            }
          }
        });
        if (step.subSteps && step.subSteps.length) {
          step.subSteps.forEach((sub) => {
            sub.fields.forEach((field) => {
              if (field.type === "date" && field.name in loadedData && loadedData[field.name]) {
                const dateValue = loadedData[field.name];
                if (typeof dateValue === "string") {
                  loadedData[field.name] = new Date(dateValue);
                }
              }
            });
          });
        }
      });

      formData.value = { ...formData.value, ...loadedData };
      if (draft.currentStep >= 0 && draft.currentStep < props.steps.length) {
        currentStep.value = draft.currentStep;
      }
      if (draft.completedSteps) {
        completedSteps.value = new Set(draft.completedSteps);
      }
    }
  } catch (error) {
    console.error("Failed to load draft:", error);
  }
};

const clearDraft = () => {
  if (!props.storageKey) return;
  wizardFormStore.clearDraft(formId.value);
};

const handleFinalSubmit = async () => {
  let allValid = true;
  for (let i = 0; i < props.steps.length; i++) {
    if (!validateStep(i)) {
      allValid = false;
    }
  }

  if (!allValid) {
    for (let i = 0; i < props.steps.length; i++) {
      if (stepErrors.value[i] && Object.keys(stepErrors.value[i]).length > 0) {
        goToStep(i);
        return;
      }
    }
    return;
  }

  props.steps.forEach((step) => {
    step.fields.forEach((field) => {
      if (field.type === "date") {
        const v = formData.value[field.name];
        formData.value[field.name] = toISODateString(v);
      }
    });
  });

  isSubmitting.value = true;
  try {
    emit("form-submit", currentStep.value, formData.value);
    clearDraft();
  } finally {
    isSubmitting.value = false;
  }
};

const setupAutoSave = () => {
  if (props.autoSave && props.autoSaveInterval > 0) {
    autoSaveTimer.value = window.setInterval(() => {
      saveDraft(false);
    }, props.autoSaveInterval);
  }
};

const clearAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
  if (saveDraftDebounceTimer.value) {
    clearTimeout(saveDraftDebounceTimer.value);
    saveDraftDebounceTimer.value = null;
  }
};

onMounted(() => {
  loadDraft();
  setupAutoSave();

  if (!isCurrentStepAccessible.value) {
    const firstAccessible = accessibleSteps.value[0];
    if (firstAccessible !== undefined) {
      currentStep.value = firstAccessible;
    }
  }
  // Initialize sub-step index to first accessible for each step with subSteps
  props.steps.forEach((step, idx) => {
    if (step.subSteps && step.subSteps.length) {
      const indices = accessibleSubSteps(idx);
      if (indices.length) {
        currentSubStepIndex.value[idx] = indices[0];
      }
    }
  });
});

onUnmounted(() => {
  clearAutoSave();
});

watch(
  () => currentStep.value,
  (newStep) => {
    if (newStep !== undefined && newStep !== null) {
      // Ensure active sub-step is permitted; if not, switch to first accessible
      const step = props.steps[newStep];
      if (step?.subSteps?.length) {
        const desired = currentSubStepIndex.value[newStep] ?? 0;
        if (!hasSubStepPermission(step, desired)) {
          const firstAcc = getFirstAccessibleSubIndex(newStep);
          currentSubStepIndex.value[newStep] = firstAcc;
        }
      }
      validateStep(newStep);
    }
  },
  { immediate: false },
);

defineExpose({
  goToStep,
  goToNextStep,
  goToPreviousStep,
  validateStep,
  saveDraft,
  loadDraft,
  clearDraft,
  formData,
  handleFormUpdate,
});
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <Card v-if="props.title" class="mb-6">
      <CardHeader>
        <CardTitle class="text-2xl font-bold">{{ props.title }}</CardTitle>
      </CardHeader>
    </Card>

    <!-- Progress Bar -->
    <div v-if="props.showProgress" class="mb-2">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-muted-foreground">
          Step {{ currentStep + 1 }} of {{ props.steps.length }}
        </span>
        <span class="text-sm font-medium text-muted-foreground">
          {{ progressPercentage }}% Complete
        </span>
      </div>
      <div class="w-full bg-muted rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </div>

    <!-- Stepper Navigation -->
    <div
      class="mb-4 overflow-x-auto py-4 px-6 sticky top-[58px] z-20 bg-background/95 backdrop-blur-sm border-b"
    >
      <Stepper
        :model-value="currentStep"
        class="flex w-full items-start gap-2"
        @update:model-value="(value: number | undefined) => goToStep(value ?? 0)"
      >
        <StepperItem
          v-for="(step, index) in props.steps"
          :key="step.id"
          :hasPermission="hasStepPermission(step)"
          v-slot="{ state, hasPermission }"
          :step="index"
          :disabled="!hasStepPermission(step)"
          :data-state="
            completedSteps.has(index)
              ? 'completed'
              : !hasStepPermission(step)
                ? 'not-allowed'
                : 'inactive'
          "
          class="relative flex w-full flex-col items-center justify-center"
          :class="{
            'cursor-not-allowed': !hasStepPermission(step),
          }"
        >
          <StepperSeparator
            v-if="index < props.steps.length - 1"
            :class="[
              'absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 h-0.5 rounded-full transition-colors z-0',
              !hasStepPermission(props.steps[index + 1])
                ? 'bg-muted/30'
                : completedSteps.has(index)
                  ? 'bg-primary'
                  : 'bg-muted',
            ]"
          />
          <StepperTrigger as-child>
            <ListTooltip :message="hasPermission ? step.description : 'Access restricted.'">
              <Button
                :variant="state === 'active' ? 'default' : 'outline'"
                size="sm"
                :disabled="!hasPermission"
                @click="goToStep(index)"
                :class="[
                  'relative z-10 transition-all',
                  completedSteps.has(index) ? 'border-primary text-primary' : '',
                  'disabled:bg-muted disabled:border-muted disabled:cursor-not-allowed disabled:opacity-100',
                ]"
              >
                <StepperTitle
                  :class="[
                    'text-sm font-medium',
                    state === 'active'
                      ? 'text-white'
                      : completedSteps.has(index)
                        ? 'text-primary'
                        : hasPermission
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/60',
                  ]"
                  >{{ step.title }}
                  <Iconify
                    v-if="!hasPermission"
                    icon="mdi:lock"
                    class="ml-1 size-3 text-muted-foreground inline-block"
                  />
                </StepperTitle>
              </Button>
            </ListTooltip>
          </StepperTrigger>
        </StepperItem>
      </Stepper>
    </div>
    <div v-if="$slots.headerForm">
      <slot name="headerForm" :formData="formData" />
    </div>

    <!-- Form Content -->
    <Card class="mb-6 py-4">
      <CardHeader>
        <CardTitle class="flex items-center"
          ><Iconify
            v-if="props.steps[currentStep]?.icon"
            :icon="props.steps[currentStep]?.icon"
            class="size-4 mr-2"
          />{{ props.steps[currentStep]?.title }}</CardTitle
        >
        <CardDescription v-if="props.steps[currentStep]?.description">
          {{ props.steps[currentStep]?.description }}
        </CardDescription>
      </CardHeader>
      <CardContent class="min-h-[400px] px-6">
        <!-- Permission Denied Message -->
        <Alert v-if="!isCurrentStepAccessible" variant="destructive" class="mb-4">
          <Iconify icon="mdi:alert-circle" class="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this step. Please contact your administrator if you
            believe this is an error.
          </AlertDescription>
        </Alert>

        <!-- Sub-step Permission Denied Message -->
        <Alert
          v-else-if="props.steps[currentStep]?.subSteps?.length && !isCurrentSubStepAccessible"
          variant="destructive"
          class="mb-4"
        >
          <Iconify icon="mdi:alert-circle" class="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this section. Please contact your administrator if
            you believe this is an error.
          </AlertDescription>
        </Alert>

        <!-- Use PermissionGuard for permission-protected steps -->
        <PermissionGuard
          v-else-if="props.steps[currentStep]?.permission || props.steps[currentStep]?.permissions"
          :permission="props.steps[currentStep]?.permission"
          :permissions="props.steps[currentStep]?.permissions"
          :require-all="props.steps[currentStep]?.requireAllPermissions"
        >
          <div class="space-y-6">
            <!-- Main step fields -->
            <template v-if="mainStepOnlyConfig.fields.length">
              <FormBuilder
                :config="mainStepOnlyConfig"
                class="p-0"
                mode="edit"
                :form-id="`wizard-step-${currentStep}-main`"
                :external-errors="stepErrors[currentStep] || {}"
                @form-submit="handleStepSubmit"
                @update="handleFormUpdate"
              />
            </template>

            <!-- Inner Sub-stepper, below main fields -->
            <div
              v-if="props.steps[currentStep]?.subSteps?.length"
              class="mt-2 sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-muted pb-2"
            >
              <Stepper
                :key="`substepper-${currentStep}`"
                :model-value="currentSubStepIndex[currentStep] || 0"
                class="flex w-full justify-center items-center gap-4"
                @update:model-value="
                  (value: number | undefined) => goToSubStep(currentStep, value ?? 0)
                "
              >
                <StepperItem
                  v-for="(sub, sidx) in props.steps[currentStep]?.subSteps"
                  :key="sub.id"
                  :hasPermission="hasSubStepPermission(props.steps[currentStep], sidx)"
                  v-slot="{ state, hasPermission }"
                  :step="sidx"
                  :disabled="!hasSubStepPermission(props.steps[currentStep], sidx)"
                  :data-state="
                    completedSteps.has(sidx)
                      ? 'completed'
                      : !hasSubStepPermission(props.steps[currentStep], sidx)
                        ? 'not-allowed'
                        : 'inactive'
                  "
                  class="relative flex items-center justify-center"
                  :class="{
                    'cursor-not-allowed': !hasSubStepPermission(props.steps[currentStep], sidx),
                  }"
                >
                  <StepperSeparator
                    v-if="sidx < (props.steps[currentStep]?.subSteps?.length || 0) - 1"
                    :class="[
                      'absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 h-0.5 rounded-full transition-colors z-0',
                      !hasSubStepPermission(props.steps[currentStep], sidx + 1)
                        ? 'bg-muted/30'
                        : completedSteps.has(sidx)
                          ? 'bg-primary'
                          : 'bg-muted',
                    ]"
                  />

                  <StepperTrigger as-child>
                    <ListTooltip :message="hasPermission ? sub.description : 'Access restricted.'">
                      <Button
                        :variant="state === 'active' ? 'default' : 'outline'"
                        size="sm"
                        :disabled="!hasPermission"
                        class="relative z-10"
                        @click="goToSubStep(currentStep, sidx)"
                        :class="[
                          'relative z-10 transition-all',
                          completedSteps.has(sidx) ? 'border-primary text-primary' : '',
                          'disabled:bg-muted disabled:border-muted disabled:cursor-not-allowed disabled:opacity-100',
                        ]"
                      >
                        <StepperTitle
                          :class="[
                            'text-sm font-medium',
                            state === 'active'
                              ? 'text-white'
                              : completedSteps.has(sidx)
                                ? 'text-primary'
                                : hasPermission
                                  ? 'text-muted-foreground'
                                  : 'text-muted-foreground/60',
                          ]"
                        >
                          {{ sub.title }}
                          <Iconify
                            v-if="!hasPermission"
                            icon="mdi:lock"
                            class="ml-1 size-3 text-muted-foreground inline-block"
                          />
                        </StepperTitle>
                      </Button>
                    </ListTooltip>
                  </StepperTrigger>
                </StepperItem>
              </Stepper>
            </div>

            <!-- Active sub-step fields -->
            <template
              v-if="props.steps[currentStep]?.subSteps?.length && subStepOnlyConfig.fields.length"
            >
              <FormBuilder
                v-if="props.steps[currentStep]?.subSteps?.length && subStepOnlyConfig.fields.length"
                :config="subStepOnlyConfig"
                mode="edit"
                :form-id="`wizard-step-${currentStep}-substep-${currentSubStepIndex[currentStep] ?? 0}`"
                :external-errors="stepErrors[currentStep] || {}"
                @form-submit="handleStepSubmit"
                @update="handleFormUpdate"
              />
            </template>
            <!-- Custom component, if any -->
            <component
              v-if="props.steps[currentStep]?.component"
              :key="`custom-component-${props.steps[currentStep]?.id || currentStep}`"
              :is="props.steps[currentStep].component"
              :model-value="formData"
              v-bind="props.steps[currentStep]?.componentProps || {}"
              @update:modelValue="handleFormUpdate"
            />
          </div>
        </PermissionGuard>

        <!-- For steps without permission requirements, render directly -->
        <template v-else>
          <div class="space-y-6">
            <!-- Main step fields -->
            <template v-if="mainStepOnlyConfig.fields.length">
              <FormBuilder
                :config="mainStepOnlyConfig"
                mode="edit"
                :form-id="`wizard-step-${currentStep}-main`"
                :external-errors="stepErrors[currentStep] || {}"
                @form-submit="handleStepSubmit"
                @update="handleFormUpdate"
              />
            </template>

            <!-- Inner Sub-stepper, below main fields -->
            <div
              v-if="props.steps[currentStep]?.subSteps?.length"
              class="mt-2 sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-muted pb-2"
            >
              <Stepper
                :key="`substepper-${currentStep}`"
                :model-value="currentSubStepIndex[currentStep] || 0"
                class="flex w-full justify-center items-center gap-4"
                @update:model-value="
                  (value: number | undefined) => goToSubStep(currentStep, value ?? 0)
                "
              >
                <StepperItem
                  v-for="(sub, sidx) in props.steps[currentStep]?.subSteps"
                  :key="sub.id"
                  :hasPermission="hasSubStepPermission(props.steps[currentStep], sidx)"
                  v-slot="{ state, hasPermission }"
                  :step="sidx"
                  :disabled="!hasSubStepPermission(props.steps[currentStep], sidx)"
                  :data-state="
                    completedSteps.has(sidx)
                      ? 'completed'
                      : !hasSubStepPermission(props.steps[currentStep], sidx)
                        ? 'not-allowed'
                        : 'inactive'
                  "
                  class="relative flex items-center justify-center"
                  :class="{
                    'cursor-not-allowed': !hasSubStepPermission(props.steps[currentStep], sidx),
                  }"
                >
                  <StepperSeparator
                    v-if="sidx < (props.steps[currentStep]?.subSteps?.length || 0) - 1"
                    :class="[
                      'absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 h-0.5 rounded-full transition-colors z-0',
                      !hasSubStepPermission(props.steps[currentStep], sidx + 1)
                        ? 'bg-muted/30'
                        : completedSteps.has(sidx)
                          ? 'bg-primary'
                          : 'bg-muted',
                    ]"
                  />

                  <StepperTrigger as-child>
                    <ListTooltip :message="hasPermission ? sub.description : 'Access restricted.'">
                      <Button
                        :variant="state === 'active' ? 'default' : 'outline'"
                        size="sm"
                        :disabled="!hasPermission"
                        class="relative z-10"
                        @click="goToSubStep(currentStep, sidx)"
                        :class="[
                          'relative z-10 transition-all',
                          completedSteps.has(sidx) ? 'border-primary text-primary' : '',
                          'disabled:bg-muted disabled:border-muted disabled:cursor-not-allowed disabled:opacity-100',
                        ]"
                      >
                        <StepperTitle
                          :class="[
                            'text-sm font-medium',
                            state === 'active'
                              ? 'text-white'
                              : completedSteps.has(sidx)
                                ? 'text-primary'
                                : hasPermission
                                  ? 'text-muted-foreground'
                                  : 'text-muted-foreground/60',
                          ]"
                        >
                          {{ sub.title }}
                          <Iconify
                            v-if="!hasPermission"
                            icon="mdi:lock"
                            class="ml-1 size-3 text-muted-foreground inline-block"
                          />
                        </StepperTitle>
                      </Button>
                    </ListTooltip>
                  </StepperTrigger>
                </StepperItem>
              </Stepper>
            </div>

            <!-- Active sub-step fields -->
            <template
              v-if="props.steps[currentStep]?.subSteps?.length && subStepOnlyConfig.fields.length"
            >
              <FormBuilder
                v-if="props.steps[currentStep]?.subSteps?.length && subStepOnlyConfig.fields.length"
                :config="subStepOnlyConfig"
                mode="edit"
                :form-id="`wizard-step-${currentStep}-substep-${currentSubStepIndex[currentStep] ?? 0}`"
                :external-errors="stepErrors[currentStep] || {}"
                @form-submit="handleStepSubmit"
                @update="handleFormUpdate"
              />
            </template>

            <!-- Custom component, if any -->
            <component
              v-if="props.steps[currentStep]?.component"
              :key="`custom-component-${props.steps[currentStep]?.id || currentStep}`"
              :is="props.steps[currentStep].component"
              :model-value="formData"
              v-bind="props.steps[currentStep]?.componentProps || {}"
              @update:modelValue="handleFormUpdate"
            />
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- Navigation Buttons -->
    <div
      class="flex navigation-button items-center p-4 border-t w-[calc(100%-270px)] fixed bottom-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <template v-if="!isLastStep">
        <Button
          @click="goToNextStep"
          :disabled="!canGoNext || !isCurrentStepAccessible || isProcessingStep"
          class="flex items-center gap-2 order-3 ml-2"
        >
          <Iconify v-if="isProcessingStep" icon="uil:spinner-alt" class="size-4 animate-spin" />
          {{ isProcessingStep ? "Saving..." : props.nextButtonLabel || "Save & Next" }}
          <Iconify v-if="!isProcessingStep" icon="uil:arrow-right" class="size-4" />
        </Button>
      </template>

      <template v-else>
        <Button
          @click="handleFinalSubmit"
          :disabled="!isCurrentStepValid || isSubmitting || !isCurrentStepAccessible"
          class="flex items-center gap-2 order-3 ml-2"
        >
          <Iconify icon="mdi:check" class="h-4 w-4" />
          {{ isSubmitting ? "Submitting..." : "Submit" }}
        </Button>
      </template>

      <Button
        variant="outline"
        @click="goToPreviousStep"
        :disabled="isFirstStep"
        class="flex items-center gap-2 order-1 mr-auto"
      >
        <Iconify icon="uil:arrow-left" class="size-4" />
        Previous
      </Button>

      <Button
        v-if="props.autoSave && props.storageKey"
        variant="outline"
        @click="saveDraft"
        :disabled="isSaving"
        class="flex items-center gap-2 order-2"
      >
        <Iconify icon="material-symbols:save-outline" class="size-4" />
        {{ isSaving ? "Saving..." : "Save Draft" }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
.wizard-form-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
