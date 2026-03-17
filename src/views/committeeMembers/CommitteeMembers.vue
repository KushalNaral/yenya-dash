<template>
  <DataTable
    :data-type="'Committee Members'"
    :columns="membersColumns"
    :fetch-data="fetchCommitteeMembers"
    :actions="memberActions"
    :use-pagination="true"
    :filters-config="filtersConfig"
    :data-key="'data'"
    :refresh-key="TRIGGER_REFRESH"
    :help-content="helpContent"
    default-action-display="dialog"
    :enable-action-partitioning="true"
  >
    <template #headerActions>
      <PermissionGuard permission="create-committee-members">
        <Button
          size="sm"
          class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
          @click="handleCreate"
        >
          Create Committee Member
        </Button>
      </PermissionGuard>
    </template>
  </DataTable>

  <UnifiedFormDialog
    v-model:open="showCreateDialog"
    :mode="editMember ? 'edit' : 'create'"
    :form-config="formConfig"
    :edit-data="editMember"
    :loading="isLoading"
    :server-errors="errors"
    formId="member-form"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
  <DeleteConfirmDialog
    :model-value="showDeleteDialog"
    :deletableTitle="memberToDelete?.name"
    deletableDescription="This action cannot be undone. This will permanently delete the committee member and its related data."
    @confirm="confirmDeleteMember"
    @cancel="showDeleteDialog = false"
  >
  </DeleteConfirmDialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { committeeMemberService } from "@/services/committeeMemberService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type {
  CommitteeMember,
  CreateCommitteeMemberData,
  UpdateCommitteeMemberData,
} from "@/types/committeeMembers/committeeMember";
import { useCommitteeMemberForm } from "@/composables/useCommitteeMemberForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const memberToDelete = ref<CommitteeMember | null>(null);
const editMember = ref<CommitteeMember | null>(null);
const errors = ref<Record<string, string[]>>({});
const TRIGGER_REFRESH = "refresh-committee-members";
const isLoading = ref(false);

const { formConfig } = useCommitteeMemberForm(editMember);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage committee members effectively.",
    steps: [
      "Use the search bar to filter committee members by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete committee members.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const membersColumns: DataTableColumn<CommitteeMember>[] = [
  {
    accessorKey: "primary_image.url",
    header: "Image",
    cell: ({ value }: any) => {
      const url = value;
      return url
        ? `<img src="${url}" class="w-12 h-12 object-cover rounded shadow-sm" />`
        : '<div class="w-12 h-12 bg-muted flex items-center justify-center rounded text-[10px] text-muted-foreground">No Image</div>';
    },
  },
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "designation", header: "Designation", sortable: true },
  { accessorKey: "description", header: "Description", sortable: false },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        committeeMemberService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    sortable: false,
  },
];

const memberActions: DataTableAction<CommitteeMember>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (member: CommitteeMember) => {
      editMember.value = member;
      showCreateDialog.value = true;
    },
    permission: "update-committee-members",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (member: CommitteeMember) => {
      memberToDelete.value = member;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-committee-members",
  },
];

const filtersConfig = ref([
  {
    key: "status",
    label: "Status",
    options: [
      { value: 1, label: "Active" },
      { value: 0, label: "Inactive" },
    ],
  },
  {
    key: "type",
    label: "Type",
    options: [
      { value: "bod", label: "Board of Directors" },
      { value: "management", label: "Management" },
      { value: "incharge", label: "Department Incharge" },
    ],
  },
]);

const fetchCommitteeMembers = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<CommitteeMember>> => {
  try {
    const response = await committeeMemberService.list(params);
    errors.value = {};
    console.log(response, "from Committee Members module");
    return response as PaginatedResponse<CommitteeMember>;
  } catch (err: any) {
    errors.value = err.cause.errors;
    return createEmptyPaginatedResponse();
  }
};

const handleCreate = () => {
  editMember.value = null;
  showCreateDialog.value = true;
};

const handleSubmit = async (data: CreateCommitteeMemberData | UpdateCommitteeMemberData) => {
  isLoading.value = true;
  try {
    if (editMember.value && editMember.value.id) {
      await committeeMemberService.update(editMember.value.id, data);
    } else {
      await committeeMemberService.create(data as CreateCommitteeMemberData);
    }
    errors.value = {};
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editMember.value = null;
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in committee member");
    // Keep dialog open on error so user can fix and retry
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteMember = async () => {
  if (!memberToDelete.value) return;

  try {
    if (memberToDelete.value.id) {
      await committeeMemberService.delete(memberToDelete.value.id);
    }
    errors.value = {};
    emitter.emit(TRIGGER_REFRESH);
    showDeleteDialog.value = false;
    memberToDelete.value = null;
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in deleting committee member");
  }
};

const handleCancel = () => {
  editMember.value = null;
  errors.value = {};
};
</script>
