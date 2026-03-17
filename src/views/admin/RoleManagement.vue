<template>
  <div>
    <ErrorViewer :isOpen="!!error" :message="error" @retry="fetchRoles({})" @close="error = ''" />

    <DataTable
      :data-type="'role'"
      :columns="roleColumns"
      :actions="roleActions"
      :fetch-data="fetchRoles"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-roles">
          <Button size="sm" class="shrink-0" @click="handleCreate"> Create Role </Button>
        </PermissionGuard>
      </template>

      <template #cell-Permissions="{ item }">
        <PermissionGuard permission="update-roles" v-if="item.id">
          <Button size="sm" class="shrink-0" @click="handleEditPermissions(item)">
            <Iconify icon="mdi:user-lock" class="size-4" />
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="dialogs.createEdit"
      :mode="editRole ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editRole"
      :loading="states.loading"
      formId="role-form"
      @submit="handleSubmit"
      @cancel="resetCreateEdit"
    />

    <DeleteConfirmDialog
      :model-value="dialogs.delete"
      :deletableTitle="roleToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the role and its related data."
      @confirm="confirmDeleteRole"
      @cancel="dialogs.delete = false"
    />

    <Dialog v-model:open="dialogs.permissions">
      <DialogContent
        class="sm:max-w-7xl max-w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden flex flex-col"
      >
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold">
            Assign Permissions: {{ roleForPermissions?.name }}
          </DialogTitle>
          <DialogDescription class="text-sm text-muted-foreground">
            Select permissions to assign to this role.
          </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto py-4">
          <div v-if="states.loadingPermissions" class="text-center py-8 text-muted-foreground">
            Loading permissions...
          </div>
          <div v-else-if="!hasPermissions" class="text-center py-8 text-muted-foreground">
            No permissions available
          </div>
          <template v-else>
            <div class="px-6 pb-2">
              <div class="relative">
                <Iconify
                  icon="mdi:magnify"
                  class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                />
                <Input
                  v-model="searchQuery"
                  placeholder="Search permissions..."
                  class="pl-9 pr-4"
                />
                <Button
                  v-if="searchQuery"
                  variant="ghost"
                  size="sm"
                  class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  @click="searchQuery = ''"
                >
                  <Iconify icon="mdi:close" class="size-4" />
                </Button>
              </div>
            </div>
            <div class="space-y-4">
              <div class="flex items-center justify-between px-6 pb-2">
                <span class="text-sm text-muted-foreground">
                  {{ getSelectedCount }} of {{ allPermissions.length }} selected
                </span>
                <Button variant="secondary" size="sm" class="h-7 px-2 text-xs" @click="toggleAll">
                  {{ isAllSelected ? "Uncheck All" : "Check All" }}
                </Button>
              </div>
              <Accordion
                type="multiple"
                class="space-y-2 px-6 grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                <AccordionItem
                  v-for="(perms, groupName) in filteredGroupedPermissions"
                  :key="groupName"
                  :value="groupName"
                  class="border-b last:border-b-0"
                >
                  <AccordionTrigger
                    class="text-base font-semibold capitalize py-3 px-4 hover:no-underline hover:bg-muted/50 rounded-md"
                  >
                    <div class="flex items-center justify-between w-full pr-4">
                      <span>{{ formatGroupName(groupName) }}</span>
                      <div class="flex items-center gap-3">
                        <span class="text-xs text-muted-foreground">
                          {{ getSelectedCountInGroup(perms) }} / {{ perms.length }}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          class="h-7 px-2 text-xs"
                          @click.stop="toggleAllInGroup(perms, groupName)"
                        >
                          {{ isAllSelectedInGroup(perms) ? "Uncheck All" : "Check All" }}
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        v-for="perm in perms"
                        :key="perm.name"
                        class="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/20 transition-all"
                      >
                        <Checkbox
                          :id="`perm-${perm.name}`"
                          :modelValue="selectedPermissions[perm.name] ?? false"
                          @update:modelValue="togglePermission(perm.name, $event)"
                        />
                        <Label
                          :for="`perm-${perm.name}`"
                          class="text-sm font-medium cursor-pointer flex-1"
                        >
                          {{ perm.name }}
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </template>
        </div>

        <DialogFooter class="shrink-0">
          <Button variant="outline" @click="closePermissionsDialog">Cancel</Button>
          <Button
            @click="savePermissions"
            :disabled="states.savingPermissions || !roleForPermissions?.id"
            class="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {{ states.savingPermissions ? "Saving..." : "Save Permissions" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from "vue";
import { emitter } from "@/events/eventBus";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import { createEmptyPaginatedResponse } from "@/types/pagination/pagination";
import { useRoleForm } from "@/composables/useRoleFrom";
import type { Role, CreateRoleData, UpdateRoleData } from "@/types/auth";
import { roleService } from "@/services/roleService";
import { permissionService } from "@/services/permissionService";
import type { Permission } from "@/types/permission/permission";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const dialogs = reactive({
  createEdit: false,
  delete: false,
  permissions: false,
});

const states = reactive({
  loading: false,
  loadingPermissions: false,
  savingPermissions: false,
});

const error = ref("");
const editRole = ref<Role | null>(null);
const roleToDelete = ref<Role | null>(null);
const roleForPermissions = ref<Role | null>(null);
const allPermissions = ref<Permission[]>([]);
const selectedPermissions = reactive<Record<string, boolean>>({});
const searchQuery = ref("");

const TRIGGER_REFRESH = "refresh-roles";

const { formConfig, fetchPermissions } = useRoleForm(editRole);

const hasPermissions = computed(() => allPermissions.value.length > 0);

// Group permissions by prefix (part before first hyphen)
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};

  allPermissions.value.forEach((perm) => {
    // Extract group name from permission name (e.g., "list-menu" -> "menu")
    const parts = perm.name.split("-");
    const groupName = parts.length > 1 ? parts.slice(1).join("-") : "other";

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(perm);
  });

  // Sort groups alphabetically
  const sortedGroups: Record<string, Permission[]> = {};
  Object.keys(groups)
    .sort()
    .forEach((key) => {
      sortedGroups[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

  return sortedGroups;
});

// Filter grouped permissions based on search query
const filteredGroupedPermissions = computed(() => {
  if (!searchQuery.value.trim()) {
    return groupedPermissions.value;
  }

  const query = searchQuery.value.toLowerCase();
  const filtered: Record<string, Permission[]> = {};

  Object.entries(groupedPermissions.value).forEach(([groupName, perms]) => {
    const matchingPerms = perms.filter(
      (perm) => perm.name.toLowerCase().includes(query) || groupName.toLowerCase().includes(query),
    );

    if (matchingPerms.length > 0) {
      filtered[groupName] = matchingPerms;
    }
  });

  return filtered;
});

const formatGroupName = (groupName: string): string => {
  return groupName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "Manage roles and their permissions.",
    steps: [
      "Search and filter roles.",
      "Edit, delete, or assign permissions.",
      "Use pagination for large lists.",
    ],
  },
];

const getSelectedCount = computed(() => {
  return Object.values(selectedPermissions).filter(Boolean).length;
});

const isAllSelected = computed(() => {
  return (
    allPermissions.value.length > 0 &&
    allPermissions.value.every((p) => selectedPermissions[p.name] ?? false)
  );
});

const toggleAll = () => {
  const allSelected = isAllSelected.value;
  allPermissions.value.forEach((perm) => {
    selectedPermissions[perm.name] = !allSelected;
  });
};

const getSelectedCountInGroup = (perms: Permission[]): number => {
  return perms.filter((p) => selectedPermissions[p.name] ?? false).length;
};

const isAllSelectedInGroup = (perms: Permission[]): boolean => {
  return perms.length > 0 && perms.every((p) => selectedPermissions[p.name] ?? false);
};

const toggleAllInGroup = (perms: Permission[], groupName: string) => {
  const allSelected = isAllSelectedInGroup(perms);
  perms.forEach((perm) => {
    selectedPermissions[perm.name] = !allSelected;
  });
};

const roleColumns: DataTableColumn<Role>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  {
    accessorKey: "permissions",
    header: "Permissions",
    sortable: false,
    cell: ({ row }) => {
      const perms = row.permissions || [];
      return perms.length > 0 ? `${perms.length} permission(s)` : "No permissions";
    },
  },
  { accessorKey: "Permissions", header: "Actions", sortable: false },
];

const roleActions: DataTableAction<Role>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (role) => openEditDialog(role),
    partition: 1,
    permission: "update-roles",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (role) => {
      roleToDelete.value = role;
      dialogs.delete = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "delete-roles",
  },
];

const filtersConfig = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: 1, label: "Active" },
      { value: 0, label: "Inactive" },
    ],
  },
];

const fetchRoles = async (params: Record<string, any>) => {
  try {
    const response = await roleService.listRoles(params);
    error.value = "";
    return response;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch roles";
    return createEmptyPaginatedResponse();
  }
};

const loadPermissionsForRole = async () => {
  if (!roleForPermissions.value?.id) return;
  states.loadingPermissions = true;
  try {
    // Load all permissions
    const permissions = await permissionService.getAllPermissions();
    allPermissions.value = permissions;

    // Clear existing selections
    Object.keys(selectedPermissions).forEach((k) => delete selectedPermissions[k]);

    // Set selected permissions from role
    if (roleForPermissions.value.permissions) {
      roleForPermissions.value.permissions.forEach((permName) => {
        selectedPermissions[permName] = true;
      });
    }
  } catch (e: any) {
    error.value = e.message ?? "Failed to load permissions";
  } finally {
    states.loadingPermissions = false;
  }
};

const openEditDialog = (role: Role) => {
  editRole.value = role;
  dialogs.createEdit = true;
};

const handleCreate = () => {
  editRole.value = null;
  dialogs.createEdit = true;
};

const resetCreateEdit = () => {
  editRole.value = null;
  dialogs.createEdit = false;
};

const handleSubmit = async (data: Record<string, any>) => {
  states.loading = true;
  try {
    const roleData: CreateRoleData | UpdateRoleData = {
      name: data.name as string,
      permissions: (data.permissions as string[]) || [],
    };

    if (editRole.value?.id) {
      await roleService.updateRole(editRole.value.id, roleData as UpdateRoleData);
    } else {
      await roleService.createRole(roleData as CreateRoleData);
    }
    emitter.emit(TRIGGER_REFRESH);
    resetCreateEdit();
  } catch (err: any) {
    error.value = err.message || "Failed to save role";
  } finally {
    states.loading = false;
  }
};

const confirmDeleteRole = async () => {
  if (!roleToDelete.value?.id) return;
  try {
    await roleService.deleteRole(roleToDelete.value.id);
    emitter.emit(TRIGGER_REFRESH);
  } catch (err: any) {
    error.value = err.message || "Failed to delete role";
  } finally {
    dialogs.delete = false;
    roleToDelete.value = null;
  }
};

const handleEditPermissions = (role: Role) => {
  roleForPermissions.value = role;
  dialogs.permissions = true;
};

const closePermissionsDialog = () => {
  dialogs.permissions = false;
  roleForPermissions.value = null;
  allPermissions.value = [];
  Object.keys(selectedPermissions).forEach((k) => delete selectedPermissions[k]);
};

const togglePermission = (name: string, checked: boolean) => {
  selectedPermissions[name] = checked;
};

const savePermissions = async () => {
  if (!roleForPermissions.value?.id) return;
  states.savingPermissions = true;
  try {
    const selectedPermissionNames = Object.entries(selectedPermissions)
      .filter(([, checked]) => checked)
      .map(([name]) => name);

    await roleService.updateRole(roleForPermissions.value.id, {
      name: roleForPermissions.value.name,
      permissions: selectedPermissionNames,
    });

    emitter.emit(TRIGGER_REFRESH);
    closePermissionsDialog();
  } catch (err: any) {
    error.value = err.message || "Failed to save permissions";
  } finally {
    states.savingPermissions = false;
  }
};

watch(
  () => dialogs.createEdit,
  (open) => {
    if (open) fetchPermissions();
  },
);

watch(
  () => dialogs.permissions,
  (open) => {
    if (open && roleForPermissions.value?.id) loadPermissionsForRole();
    else if (!open) closePermissionsDialog();
  },
);
</script>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: all 0.35s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.perm-enter-active,
.perm-leave-active {
  transition: all 0.25s ease;
}
.perm-enter-from,
.perm-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.perm-leave-active {
  position: absolute;
}
</style>
