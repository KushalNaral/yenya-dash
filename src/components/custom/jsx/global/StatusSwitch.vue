<template>
  <div class="flex items-center justify-center p-1">
    <Switch :checked="isActive" :disabled="isLoading || !hasId" @update:modelValue="handleToggle" />

    <DeleteConfirmDialog
      v-model:open="showConfirmDialog"
      :deletableTitle="getEntityName()"
      :deletableDescription="getConfirmMessage()"
      mode="status"
      :deleteTitle="pendingStatus === config.activeValue ? 'Activate' : 'Deactivate'"
      @confirm="confirmStatusChange"
      @cancel="cancelStatusChange"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from "vue";
import { emitter } from "@/events/eventBus";
import { useToast } from "@/composables/useToast";
import type { DataTableColumn } from "@/types/datatable";

interface StatusSwitchConfig {
  onChangeStatus: (id: number | string, status: any) => Promise<void>;
  refreshKey?: string;
  statusField?: string;
  idField?: string;
  activeValue?: any;
  inactiveValue?: any;
  successMessage?: string;
  errorMessage?: string;
}

interface Props<T extends Record<string, any>> {
  row: T;
  value?: any;
  column?: DataTableColumn<T>;
  rowIndex?: number;
  onChangeStatus?: (id: number | string, status: any) => Promise<void>;
  refreshKey?: string;
  statusField?: string;
  idField?: string;
  activeValue?: any;
  inactiveValue?: any;
  successMessage?: string;
  errorMessage?: string;
}

const props = defineProps<Props<T>>();

const { showToast, showErrorToast } = useToast();
const isLoading = ref(false);
const localStatus = ref<any>(null);
const showConfirmDialog = ref(false);
const pendingStatusChange = ref<{ id: number | string; status: any } | null>(null);
const pendingStatus = ref<any>(null);

// Get configuration from props or column.statusSwitchConfig
const config = computed<StatusSwitchConfig>(() => {
  const columnConfig = (props.column as any)?.statusSwitchConfig as StatusSwitchConfig | undefined;
  const onChangeStatusFn =
    props.onChangeStatus || columnConfig?.onChangeStatus || (() => Promise.resolve());
  return {
    onChangeStatus: onChangeStatusFn,
    refreshKey: props.refreshKey || columnConfig?.refreshKey,
    statusField: props.statusField || columnConfig?.statusField || "status",
    idField: props.idField || columnConfig?.idField || "id",
    activeValue: props.activeValue ?? columnConfig?.activeValue ?? 1,
    inactiveValue: props.inactiveValue ?? columnConfig?.inactiveValue ?? 0,
    successMessage:
      props.successMessage || columnConfig?.successMessage || "Status updated successfully",
    errorMessage: props.errorMessage || columnConfig?.errorMessage || "Failed to update status",
  };
});

const hasId = computed(() => {
  const idField = config.value.idField;
  if (!idField) {
    return false;
  }
  const id = props.row[idField];
  const result = id !== undefined && id !== null;
  return result;
});

const getCurrentStatus = () => {
  // If localStatus is explicitly set (not null/undefined), use it
  // Otherwise, read from the row data
  if (localStatus.value !== null && localStatus.value !== undefined) {
    return localStatus.value;
  }
  const statusField = config.value.statusField;
  if (!statusField) return null;
  return props.row[statusField];
};

watch(
  () => {
    const statusField = config.value.statusField;
    return statusField ? props.row[statusField] : null;
  },
  () => {
    // Only reset localStatus if there's no pending change
    if (!pendingStatusChange.value) {
      localStatus.value = undefined;
    }
  },
  { immediate: true },
);

const isActive = computed(() => {
  const currentStatus = getCurrentStatus();
  const activeVal = config.value.activeValue;
  return (
    currentStatus === activeVal ||
    currentStatus === 1 ||
    currentStatus === true ||
    (activeVal === 1 && currentStatus === "1")
  );
});

const handleToggle = (checked: boolean) => {
  if (!hasId.value || !config.value.onChangeStatus) {
    return;
  }

  const idField = config.value.idField;
  if (!idField) return;

  const id = props.row[idField];
  const newStatus = checked ? config.value.activeValue : config.value.inactiveValue;

  // Store pending change and show confirmation dialog
  // Update localStatus to show pending state visually
  pendingStatusChange.value = { id, status: newStatus };
  pendingStatus.value = newStatus;
  localStatus.value = newStatus; // Show pending state
  showConfirmDialog.value = true;
};

const confirmStatusChange = async () => {
  if (!pendingStatusChange.value || !config.value.onChangeStatus) return;

  const { id, status } = pendingStatusChange.value;
  isLoading.value = true;
  localStatus.value = status;

  try {
    await config.value.onChangeStatus(id, status);
    const successMsg: string = config.value.successMessage || "Status updated successfully";
    showToast(successMsg, "success");
    if (config.value.refreshKey) {
      emitter.emit(config.value.refreshKey);
    }
  } catch (error: any) {
    localStatus.value = null;
    showErrorToast({
      message: error.message || config.value.errorMessage || "Failed to update status",
    });
  } finally {
    isLoading.value = false;
    pendingStatusChange.value = null;
    pendingStatus.value = null;
  }
};

const cancelStatusChange = () => {
  // Reset pending changes - the switch will revert to original state
  pendingStatusChange.value = null;
  pendingStatus.value = null;
  // Reset localStatus to undefined so getCurrentStatus() reads from props.row
  localStatus.value = undefined;
};

const getEntityName = () => {
  // Try to get a name/title from the row, fallback to generic
  const nameField = props.row?.name || props.row?.title || props.row?.id;
  return nameField ? String(nameField) : "this item";
};

const getConfirmMessage = () => {
  const action = pendingStatus.value === config.value.activeValue ? "activate" : "deactivate";
  return `Are you sure you want to ${action} "${getEntityName()}"?`;
};
</script>
