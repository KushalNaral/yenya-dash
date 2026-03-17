<template>
  <div>
    <DataTable
      :data-type="'menu'"
      :columns="menuColumns"
      :actions="menuActions"
      :fetch-data="fetchMenus"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
      :draggable-config="{
        enabled: true,
        orderField: 'order',
        onReorder: menuService.reorder,
      }"
    >
      <template #headerActions>
        <PermissionGuard permission="create-menus">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Menu
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editMenu ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editMenu"
      :loading="isLoading"
      :server-errors="errors"
      formId="menu-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="menuToDelete?.title"
      deletableDescription="This action cannot be undone. This will permanently delete the menu and its related data."
      @confirm="confirmDeleteMenu"
      @cancel="showDeleteDialog = false"
      mode="delete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { menuService } from "@/services/menuService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type { Menu, CreateMenuData, UpdateMenuData } from "@/types/menus/menu";
import { useMenuForm } from "@/composables/useMenuForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const menuToDelete = ref<Menu | null>(null);
const editMenu = ref<Menu | null>(null);
const allMenus = ref<Menu[]>([]);
const TRIGGER_REFRESH = "refresh-menus";
const errors = ref<Record<string, string[]>>({});
const isLoading = ref(false);

const { formConfig } = useMenuForm(editMenu, allMenus);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "Manage website navigation menus with hierarchical structure support.",
    steps: [
      "Use the search bar to filter menus by title.",
      "Apply status and type filters to narrow down the list.",
      "Menus support parent-child relationships for nested navigation.",
      "Use action buttons to edit, activate/deactivate, or delete menus.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const menuColumns: DataTableColumn<Menu>[] = [
  { accessorKey: "title", header: "Title", sortable: true },
  {
    accessorKey: "type",
    header: "Type",
    sortable: true,
    cell: ({ value }: any) => {
      const typeLabels: Record<string, string> = {
        top: "Top",
        main: "Main",
        footer: "Footer",
      };
      const label = typeLabels[value] || value;
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${label}</span>`;
    },
  },
  {
    accessorKey: "parent.title",
    header: "Parent Menu",
    sortable: false,
    cell: ({ value }: any) => {
      return value || '<span class="text-muted-foreground text-sm">Top Level</span>';
    },
  },
  {
    accessorKey: "link",
    header: "Link",
    sortable: false,
    cell: ({ value }: any) => {
      if (!value) return '<span class="text-muted-foreground text-sm">No Link</span>';
      return `<a href="${value}" target="_blank" class="text-primary hover:underline">${value}</a>`;
    },
  },
  {
    accessorKey: "target",
    header: "Target",
    sortable: false,
    cell: ({ value }: any) => {
      if (value === "_blank") {
        return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">New Window</span>';
      }
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Same Window</span>';
    },
  },
  {
    accessorKey: "is_button",
    header: "Button",
    sortable: true,
    cell: ({ value }: any) => {
      if (value) {
        return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Yes</span>';
      }
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No</span>';
    },
  },
  { accessorKey: "order", header: "Order", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        menuService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const menuActions: DataTableAction<Menu>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (menu: Menu) => {
      editMenu.value = menu;
      showCreateDialog.value = true;
    },
    permission: "update-menus",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (menu: Menu) => {
      menuToDelete.value = menu;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-menus",
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
    label: "Menu Type",
    options: [
      { value: "top", label: "Top" },
      { value: "main", label: "Main" },
      { value: "footer", label: "Footer" },
    ],
  },
]);

// Load all menus for parent dropdown
onMounted(async () => {
  await loadAllMenus();
});

const loadAllMenus = async () => {
  try {
    const menus = await menuService.getAll();
    allMenus.value = menus;
  } catch (err: any) {
    console.error("Failed to load menus for parent dropdown:", err);
  }
};

const fetchMenus = async (params: Record<string, any>): Promise<PaginatedResponse<Menu>> => {
  try {
    const response = await menuService.list({ ...params, hierarchy: true });
    errors.value = {};

    if (Array.isArray(response)) {
      return {
        data: response,
        current_page: 1,
        per_page: response.length,
        total: response.length,
        last_page: 1,
      } as unknown as PaginatedResponse<Menu>;
    }

    return response as PaginatedResponse<Menu>;
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
    return createEmptyPaginatedResponse<Menu>();
  }
};

const handleCreate = () => {
  editMenu.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editMenu.value = null;
};

const handleSubmit = async (data: CreateMenuData | UpdateMenuData) => {
  isLoading.value = true;
  try {
    if (editMenu.value && editMenu.value.id) {
      await menuService.update(editMenu.value.id, data);
    } else {
      await menuService.create(data as CreateMenuData);
    }
    errors.value = {};
    emitter.emit(TRIGGER_REFRESH);
    // Reload menus for parent dropdown
    await loadAllMenus();
    showCreateDialog.value = false;
    editMenu.value = null;
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteMenu = async () => {
  if (!menuToDelete.value) return;

  try {
    if (menuToDelete.value.id) {
      await menuService.delete(menuToDelete.value.id);
      errors.value = {};
      emitter.emit(TRIGGER_REFRESH);
      // Reload menus for parent dropdown
      await loadAllMenus();
    }
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
  } finally {
    showDeleteDialog.value = false;
    menuToDelete.value = null;
  }
};
</script>
