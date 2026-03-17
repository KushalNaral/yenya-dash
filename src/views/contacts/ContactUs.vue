<template>
  <div>
    <DataTable
      :data-type="'contact-us'"
      :columns="contactColumns"
      :actions="contactActions"
      :fetch-data="fetchContacts"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-contact-us">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Contact
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editContact ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editContact"
      :loading="isLoading"
      formId="contact-us-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="contactToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the contact and its related data."
      @confirm="confirmDeleteContact"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { contactUsService } from "@/services/contactUsService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type {
  ContactUs,
  CreateContactUsData,
  UpdateContactUsData,
} from "@/types/contacts/contactUs";
import { useContactUsForm } from "@/composables/useContactUsForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const contactToDelete = ref<ContactUs | null>(null);
const editContact = ref<ContactUs | null>(null);
const TRIGGER_REFRESH = "refresh-contact-us";
const error = ref("");
const isLoading = ref(false);

const { formConfig } = useContactUsForm(editContact);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "Manage contact office information displayed on the website.",
    steps: [
      "Use the search bar to filter contacts by office name.",
      "Apply status filters to narrow down the list.",
      "Use the head office indicator to highlight the main office.",
      "Use action buttons to edit or delete contact entries.",
    ],
  },
];

const contactColumns: DataTableColumn<ContactUs>[] = [
  {
    accessorKey: "name",
    header: "Office Name",
    sortable: true,
  },
  {
    accessorKey: "address",
    header: "Address",
    sortable: false,
  },
  {
    accessorKey: "contact_number",
    header: "Contact Number",
    sortable: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    sortable: false,
  },
  {
    accessorKey: "focal_person",
    header: "Focal Person",
    sortable: false,
  },
  {
    accessorKey: "is_head_office",
    header: "Head Office",
    sortable: true,
    cell: ({ value }: any) => {
      if (value) {
        return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Yes</span>';
      }
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No</span>';
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        contactUsService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const contactActions: DataTableAction<ContactUs>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (contact: ContactUs) => {
      editContact.value = contact;
      showCreateDialog.value = true;
    },
    permission: "update-contact-us",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (contact: ContactUs) => {
      contactToDelete.value = contact;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-contact-us",
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

const fetchContacts = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<ContactUs>> => {
  try {
    const response = await contactUsService.list(params);
    error.value = "";
    return response as PaginatedResponse<ContactUs>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch contacts";
    return createEmptyPaginatedResponse<ContactUs>();
  }
};

const handleCreate = () => {
  editContact.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editContact.value = null;
};

const handleSubmit = async (data: CreateContactUsData | UpdateContactUsData) => {
  isLoading.value = true;
  try {
    if (editContact.value && editContact.value.id) {
      await contactUsService.update(editContact.value.id, data);
    } else {
      await contactUsService.create(data as CreateContactUsData);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editContact.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save contact";
    // Keep dialog open on error so user can fix and retry
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteContact = async () => {
  if (!contactToDelete.value) return;

  try {
    if (contactToDelete.value.id) {
      await contactUsService.delete(contactToDelete.value.id);
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete contact";
  } finally {
    showDeleteDialog.value = false;
    contactToDelete.value = null;
  }
};
</script>
