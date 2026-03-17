<template>
  <div>
    <div v-if="isLoading" class="text-muted-foreground text-sm italic cursor-default">
      Loading...
    </div>
    <ListTooltip
      v-else
      :items="currentRoles"
      empty-message="Click to assign roles"
      single-item-message="Click to edit"
      title="Assigned Roles:"
      footer-message="Click to edit"
      :delay-duration="0"
      side="top"
    >
      <div
        v-if="!currentRoles.length"
        class="flex items-center gap-2 cursor-pointer hover:text-primary"
        @click="openDialog"
      >
        <span class="text-muted-foreground text-sm italic">No roles</span>
      </div>
      <div
        v-else
        class="flex items-center gap-2 flex-wrap cursor-pointer group"
        @click="openDialog"
      >
        <Badge
          v-if="currentRoles.length === 1"
          variant="secondary"
          class="capitalize py-1 text-xs group-hover:opacity-80 transition-opacity cursor-pointer"
        >
          {{ currentRoles[0] }}
        </Badge>
        <Badge
          v-else
          variant="secondary"
          class="capitalize py-1 text-xs group-hover:opacity-80 transition-opacity"
        >
          {{ currentRoles[0] }}... + {{ currentRoles.length - 1 }}
        </Badge>
      </div>
    </ListTooltip>

    <Dialog v-model:open="isOpen">
      <DialogContent class="max-w-5xl sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold"> Assign Roles: {{ user?.name }} </DialogTitle>
          <DialogDescription class="text-sm text-muted-foreground">
            Select roles to assign to this user.
          </DialogDescription>
        </DialogHeader>

        <div class="w-full sm:w-1/2 lg:w-1/3">
          <div class="relative">
            <Iconify
              icon="mdi:magnify"
              class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input v-model="searchQuery" placeholder="Search roles..." class="pl-9 pr-4" />
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

        <div class="flex-1 overflow-y-auto py-4">
          <div v-if="states.loading" class="text-center py-8 text-muted-foreground">
            Loading roles...
          </div>
          <div v-else-if="!hasRoles" class="text-center py-8 text-muted-foreground">
            No roles available
          </div>
          <div
            v-else-if="filteredRoles.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            No roles match your search
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 space-y-2">
            <div
              v-for="role in filteredRoles"
              :key="role.id"
              class="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/20 transition-all border"
            >
              <Checkbox
                :id="`role-${role.id}`"
                :modelValue="selectedRoles[role.name] ?? false"
                @update:modelValue="toggleRole(role.name, $event)"
              />
              <Label :for="`role-${role.id}`" class="text-sm font-medium cursor-pointer flex-1">
                {{ role.name }}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter class="shrink-0">
          <Button variant="outline" @click="closeDialog">Cancel</Button>
          <Button
            @click="saveRoles"
            :disabled="states.saving || !user?.id"
            class="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {{ states.saving ? "Saving..." : "Save Roles" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from "vue";
import { roleService } from "@/services/roleService";
import type { User } from "@/types/users/user";
import type { Role } from "@/types/auth";

interface Props {
  user: User;
  rolesCache: Record<number, { roles: string[]; loading: boolean }>;
}

interface Emits {
  (e: "rolesUpdated", userId: number): void;
  (e: "error", message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = ref(false);
const searchQuery = ref("");
const allRoles = ref<Role[]>([]);
const selectedRoles = reactive<Record<string, boolean>>({});

const states = reactive({
  loading: false,
  saving: false,
});

const isLoading = computed(() => {
  return !props.rolesCache[props.user.id] || props.rolesCache[props.user.id].loading;
});

const currentRoles = computed(() => {
  return props.rolesCache[props.user.id]?.roles || [];
});

const hasRoles = computed(() => allRoles.value.length > 0);

const filteredRoles = computed(() => {
  if (!searchQuery.value.trim()) return allRoles.value;
  const query = searchQuery.value.toLowerCase();
  return allRoles.value.filter((role) => role.name.toLowerCase().includes(query));
});

const openDialog = () => {
  isOpen.value = true;
};

const closeDialog = () => {
  isOpen.value = false;
  searchQuery.value = "";
  allRoles.value = [];
  Object.keys(selectedRoles).forEach((k) => delete selectedRoles[k]);
};

const loadRoles = async () => {
  if (!props.user.id) return;
  states.loading = true;
  try {
    const rolesResponse = await roleService.getAllRoles();
    allRoles.value = Array.isArray(rolesResponse) ? rolesResponse : [];

    // Clear existing selections
    Object.keys(selectedRoles).forEach((k) => delete selectedRoles[k]);

    // Set selected roles from user's current roles (role names)
    const userRoleNames = props.user.roles || [];
    userRoleNames.forEach((roleName) => {
      selectedRoles[roleName] = true;
    });
  } catch (error: any) {
    emit("error", error.message ?? "Failed to load roles");
  } finally {
    states.loading = false;
  }
};

const toggleRole = (name: string, checked: boolean) => {
  selectedRoles[name] = checked;
};

const saveRoles = async () => {
  if (!props.user.id) return;
  states.saving = true;
  try {
    const selectedRoleNames = Object.entries(selectedRoles)
      .filter(([, checked]) => checked)
      .map(([name]) => name);

    await roleService.assignRolesToUser({
      user_id: props.user.id,
      roles: selectedRoleNames,
    });

    emit("rolesUpdated", props.user.id);
    closeDialog();
  } catch (error: any) {
    emit("error", error.message || "Failed to save roles");
    await loadRoles();
  } finally {
    states.saving = false;
  }
};

watch(isOpen, (open) => {
  if (open) loadRoles();
  else closeDialog();
});
</script>
