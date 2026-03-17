<template>
  <div>
    <DataTable
      :data-type="'open-career'"
      :columns="openCareerColumns"
      :actions="openCareerActions"
      :fetch-data="fetchOpenCareers"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    />

    <UnifiedFormDialog
      v-model:open="showViewDialog"
      :mode="'view'"
      :form-config="viewFormConfig"
      :edit-data="selectedOpenCareer"
      :loading="false"
      formId="open-career-view-form"
      @cancel="handleViewCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="openCareerToDelete?.full_name"
      deletableDescription="This action cannot be undone. This will permanently delete the open career application and its related data."
      @confirm="confirmDeleteOpenCareer"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { openCareerService } from "@/services/openCareerService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type { OpenCareer } from "@/types/openCareers/openCareer";
import type { FormConfig } from "@/types/form";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showViewDialog = ref(false);
const showDeleteDialog = ref(false);
const openCareerToDelete = ref<OpenCareer | null>(null);
const selectedOpenCareer = ref<OpenCareer | null>(null);
const TRIGGER_REFRESH = "refresh-open-careers";
const errors = ref<Record<string, string[]>>({});

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "View and manage open career applications submitted through the frontend portal.",
    steps: [
      "Use the search bar to filter applications by name or position.",
      "Apply status filters to narrow down the list.",
      "Click 'View Details' to see full application including cover letter.",
      "Download CV/Resume if the candidate is interesting.",
      "Use action buttons to change status or delete applications.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const viewFormConfig = computed<FormConfig>(() => {
  const career = selectedOpenCareer.value;
  return {
    submitLabel: "",
    resetLabel: "",
    showReset: false,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "full_name",
        label: "Full Name",
      },
      {
        type: "text",
        name: "email",
        label: "Email",
      },
      {
        type: "text",
        name: "phone_number",
        label: "Phone Number",
      },
      {
        type: "text",
        name: "position_applied",
        label: "Position Applied",
      },
      {
        type: "textarea",
        name: "cover_letter",
        label: "Cover Letter",
        colSpan: 2,
      },
      {
        type: "textarea",
        name: "experience",
        label: "Experience",
        colSpan: 2,
      },
      {
        type: "file",
        name: "assets",
        label: "CV/Resume",
        colSpan: 2,
      },
    ],
    initialValues: career
      ? {
          full_name: career.full_name || "",
          email: career.email || "",
          phone_number: career.phone_number || "",
          position_applied: career.position_applied || "",
          cover_letter: career.cover_letter || "",
          experience: career.experience || "",
          assets: career.primary_file?.url || null,
        }
      : {},
  };
});

const openCareerColumns: DataTableColumn<OpenCareer>[] = [
  { accessorKey: "full_name", header: "Full Name", sortable: true },
  { accessorKey: "email", header: "Email", sortable: true },
  { accessorKey: "phone_number", header: "Phone", sortable: false },
  { accessorKey: "position_applied", header: "Position Applied", sortable: true },
  {
    accessorKey: "primary_file.url",
    header: "CV/Resume",
    cell: ({ value, row }: any) => {
      const url = value;
      const fileName = row.original?.primary_file?.name || "resume";
      if (url) {
        return `<a href="${url}" download="${fileName}" class="text-primary hover:underline flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Download
        </a>`;
      }
      return '<span class="text-muted-foreground text-sm">No CV</span>';
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        openCareerService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const openCareerActions: DataTableAction<OpenCareer>[] = [
  {
    label: "View Details",
    icon: "lucide:eye",
    handler: (openCareer: OpenCareer) => {
      selectedOpenCareer.value = openCareer;
      showViewDialog.value = true;
    },
    permission: "view-open-careers",
  },
  {
    label: "Download CV",
    icon: "lucide:download",
    handler: (openCareer: OpenCareer) => {
      if (openCareer.primary_file?.url) {
        const link = document.createElement("a");
        link.href = openCareer.primary_file.url;
        link.download = openCareer.primary_file.name || `CV_${openCareer.full_name}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    },
    permission: "view-open-careers",
    showIf: (openCareer: OpenCareer) => !!openCareer.primary_file?.url,
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (openCareer: OpenCareer) => {
      openCareerToDelete.value = openCareer;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-open-careers",
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

const fetchOpenCareers = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<OpenCareer>> => {
  try {
    const response = await openCareerService.list(params);
    errors.value = {};
    return response as PaginatedResponse<OpenCareer>;
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
    return createEmptyPaginatedResponse<OpenCareer>();
  }
};

const handleViewCancel = () => {
  selectedOpenCareer.value = null;
};

const confirmDeleteOpenCareer = async () => {
  if (!openCareerToDelete.value) return;

  try {
    if (openCareerToDelete.value.id) {
      await openCareerService.delete(openCareerToDelete.value.id);
      errors.value = {};
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
  } finally {
    showDeleteDialog.value = false;
    openCareerToDelete.value = null;
  }
};
</script>
