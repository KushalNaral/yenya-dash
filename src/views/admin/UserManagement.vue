<template>
  <div>
    <DataTable
      :data-type="'user'"
      :columns="userColumns"
      :actions="userActions"
      :fetch-data="fetchUsers"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-users">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary/20 hover:text-primary cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create User
          </Button>
        </PermissionGuard>
      </template>

      <template #cell-Roles="{ item }">
        <UserRolesManager
          :user="item"
          :roles-cache="rolesCache"
          @roles-updated="handleRolesUpdated"
          @error="handleRolesError"
        />
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-if="showDialog"
      v-model:open="showDialog"
      :mode="editUser ? 'edit' : 'create'"
      :form-config="formConfig"
      :loading="isLoading"
      formId="user-form"
      @submit="handleSubmit"
      @cancel="resetCreateEdit"
    />

    <DeleteConfirmDialog
      v-model:open="showDeleteDialog"
      :deletableTitle="userToDelete?.name || 'User'"
      deletableDescription="This action cannot be undone. This will permanently delete the user and its related data."
      @confirm="confirmDeleteUser"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { emitter } from "@/events/eventBus";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import StatusCell from "@/components/custom/jsx/global/StatusCell";
import type { User, CreateUserData, UpdateUserData } from "@/types/users/user";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import { useUserForm } from "@/composables/useUserForm";
import {
  deleteUser,
  getUserForEdit,
  listUsers,
  register,
  updateUser,
} from "../../services/authService";
import { useUserRoleManager } from "@/composables/useUserRoleManager";

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const editUser = ref<User | null>(null);
const userToDelete = ref<User | null>(null);
const error = ref("");
const isLoading = ref(false);

const TRIGGER_REFRESH = "refresh-users";

const { formConfig } = useUserForm(editUser);
const { cache: rolesCache, loadMultipleUserRoles, refreshUserRoles } = useUserRoleManager();

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "Manage users and their role assignments efficiently.",
    steps: [
      "Search and filter users by name or status.",
      "Click on role badges to assign or edit user roles.",
      "Use action buttons to edit or delete users.",
      "Navigate through pages using pagination controls.",
    ],
  },
];

const userColumns: DataTableColumn<User>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "email", header: "Email", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusCell,
  },
  {
    accessorKey: "verified_status",
    header: "Verified",
    sortable: true,
    cell: ({ row }: { row: User }) => {
      const status = row.verified_status;
      if (status === "verified") return "Verified";
      if (status === "rejected") return "Rejected";
      return "Not Verified";
    },
  },
  { accessorKey: "Roles", header: "Roles", sortable: false },
];

const userActions: DataTableAction<User>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: async (user: User) => {
      if (!user.id) return;
      isLoading.value = true;
      try {
        const response: any = await getUserForEdit(user.id.toString());
        let rawData = response.data || response;

        // Unwrap nested record if it exists
        if (rawData && rawData.record) {
          rawData = rawData.record;
        }

        // Ensure we have a clean, non-reactive copy to work with
        const userData = structuredClone(rawData);

        // Set the data and wait for reactivity to settle
        editUser.value = userData as User;
        await nextTick();
        showDialog.value = true;
      } catch (err: any) {
        error.value = err.message || "Failed to fetch user details";
      } finally {
        isLoading.value = false;
      }
    },
    partition: 1,
    permission: "update-users",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (user: User) => {
      userToDelete.value = user;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "delete-users",
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
]);

const fetchUsers = async (params: Record<string, any>): Promise<PaginatedResponse<User>> => {
  try {
    const response = await listUsers(params);
    error.value = "";

    if (response.data && Array.isArray(response.data)) {
      const userIds = response.data.map((user: User) => user.id).filter(Boolean);
      await loadMultipleUserRoles(userIds);
    }

    return response as PaginatedResponse<User>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch users";
    return createEmptyPaginatedResponse<User>();
  }
};

const handleCreate = () => {
  editUser.value = null;
  showDialog.value = true;
};

const resetCreateEdit = () => {
  editUser.value = null;
  showDialog.value = false;
};

const handleSubmit = async (data: Record<string, any>) => {
  isLoading.value = true;
  try {
    if (editUser.value?.id) {
      // For updates, only send fields that are provided
      const updateData: UpdateUserData = {
        name: data.name as string,
        email: data.email as string,
      };

      // Include status and verified_status if provided
      if (data.status !== undefined) {
        updateData.status = data.status as number | string;
      }
      if (data.verified_status !== undefined) {
        updateData.verified_status = data.verified_status as string | number;
      }

      await updateUser(editUser.value.id.toString(), updateData);
    } else {
      // For create, validate password match
      const password = data.password as string | undefined;
      const passwordConfirmation = data.password_confirmation as string | undefined;

      if (!password || !passwordConfirmation) {
        error.value = "Password and confirmation are required";
        isLoading.value = false;
        return;
      }

      if (password !== passwordConfirmation) {
        error.value = "Passwords do not match";
        isLoading.value = false;
        return;
      }

      const createData: CreateUserData = {
        name: data.name as string,
        email: data.email as string,
        password: password,
        password_confirmation: passwordConfirmation,
      };
      await register(createData);
    }
    emitter.emit(TRIGGER_REFRESH);
    resetCreateEdit();
    error.value = "";
  } catch (err: any) {
    error.value = err.message || "Failed to save user";
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteUser = async () => {
  if (!userToDelete.value?.id) return;

  try {
    if (userToDelete.value.id) {
      await deleteUser(userToDelete.value.id.toString());
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete user";
  } finally {
    showDeleteDialog.value = false;
    userToDelete.value = null;
  }
};

const handleRolesUpdated = async (userId: number) => {
  await refreshUserRoles(userId);
  emitter.emit(TRIGGER_REFRESH);
};

const handleRolesError = (message: string) => {
  error.value = message;
};
</script>
