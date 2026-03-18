<template>
  <Sidebar :collapsible="'icon'" class="border-r bg-sidebar">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div as-child class="text-lg rounded-lg font-bold bg-background">
            <router-link to="/" class="flex items-center gap-2">
              <img
                src="../assets/images/logo.png"
                alt="who-logo"
                class="w-44 h-auto"
              />
            </router-link>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <template v-if="isSidebarOpen">
                <Input
                  ref="searchInput"
                  name="search"
                  v-model="searchQuery"
                  placeholder="Search menu..."
                  class="w-full bg-background text-foreground border-input"
                />
              </template>
              <template v-else>
                <SidebarItemTooltip label="Search">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="flex items-center justify-center rounded-lg p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                    @click="onSearchIconClick"
                  >
                    <Iconify icon="lucide:search" class="h-4 w-4" />
                  </Button>
                </SidebarItemTooltip>
              </template>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <div v-if="!filteredNavItems.length && searchQuery" class="p-4">
              <p class="text-sm text-muted-foreground">No results found</p>
            </div>
            <div v-else-if="!authStore.isAuthenticated" class="p-4">
              <p class="text-sm text-muted-foreground">Loading...</p>
            </div>
            <template v-else>
              <SidebarMenuItem
                v-for="item in filteredNavItems"
                :key="item.title"
              >
                <PermissionGuard v-bind="getPermissionProps(item.permission)">
                  <div v-if="item.children?.length">
                    <SidebarItemTooltip :label="item.title">
                      <Collapsible
                        :open="openItems[item.title]"
                        @update:open="toggleItem(item.title)"
                      >
                        <CollapsibleTrigger as-child>
                          <SidebarMenuButton
                            as-child
                            class="flex w-full h-auto text-sidebar-foreground rounded-lg items-center p-[10px] gap-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:cursor-pointer transition-all duration-300"
                            :class="{
                              'active-parent': hasActiveChild(item),
                              active: isActive(item.url),
                            }"
                            @click="onParentItemClick(item.title, $event)"
                          >
                            <div>
                              <Iconify :icon="item.icon" class="h-4 w-4" />
                              <span>{{ item.title }}</span>
                              <Iconify
                                icon="lucide:chevron-down"
                                class="h-4 w-4 ml-auto transition-transform"
                                :class="{ 'rotate-180': openItems[item.title] }"
                              />
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem
                              v-for="child in item.children"
                              :key="child.title"
                            >
                              <PermissionGuard
                                v-bind="getPermissionProps(child.permission)"
                              >
                                <SidebarMenuButton
                                  as-child
                                  class="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground h-auto rounded-lg items-center p-[10px] transition-all duration-300"
                                  :class="{ active: isActive(child.url) }"
                                  @click="onChildItemClick(item.title)"
                                >
                                  <router-link
                                    :to="child.url"
                                    class="flex items-center gap-2"
                                  >
                                    <Iconify
                                      :icon="child.icon"
                                      class="h-4 w-4"
                                    />
                                    <span>{{ child.title }}</span>
                                  </router-link>
                                </SidebarMenuButton>
                              </PermissionGuard>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarItemTooltip>
                  </div>
                  <div v-else>
                    <SidebarItemTooltip :label="item.title">
                      <SidebarMenuButton
                        as-child
                        class="flex items-center gap-2 text-sidebar-foreground rounded-lg p-[10px] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-auto transition-all duration-300"
                        :class="{ active: isActive(item.url) }"
                        @click="ensureSidebarOpen"
                      >
                        <router-link
                          :to="item.url"
                          class="flex items-center gap-2 w-full"
                        >
                          <Iconify :icon="item.icon" class="h-4 w-4" />
                          <span>{{ item.title }}</span>
                        </router-link>
                      </SidebarMenuButton>
                    </SidebarItemTooltip>
                  </div>
                </PermissionGuard>
              </SidebarMenuItem>
            </template>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <PermissionGuard permission="update-profile">
            <SidebarMenuButton as-child>
              <router-link
                to="/profile"
                class="flex items-center gap-2 transition-all duration-300 h-auto rounded-lg p-[10px]"
              >
                <Iconify icon="lucide:user" class="h-4 w-4" />
                <span>{{ authStore.user?.username || "Profile" }}</span>
              </router-link>
            </SidebarMenuButton>
          </PermissionGuard>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <Button
              @click="handleLogout"
              class="flex items-center gap-2 cursor-pointer bg-destructive text-destructive-foreground h-auto rounded-lg p-[10px] hover:bg-destructive/80 transition-all duration-200 hover:scale-105 hover:text-white"
            >
              <Iconify icon="lucide:log-out" class="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSidebar } from "@/components/ui/sidebar/utils";
import SidebarItemTooltip from "@/components/ui/sidebar/SidebarItemTooltip.vue";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const searchQuery = ref("");
const searchInput = ref<HTMLInputElement | null>(null);
const openItems = ref<Record<string, boolean>>({});
const { state, setOpen } = useSidebar();
const isSidebarOpen = computed(() => state.value === "expanded");

const onSearchIconClick = () => {
  setOpen(true);
  nextTick(() => {
    searchInput.value?.focus();
  });
};

const ensureSidebarOpen = () => {
  if (!isSidebarOpen.value) {
    setOpen(true);
  }
};

const onParentItemClick = (title: string, event: MouseEvent) => {
  if (!isSidebarOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
    openItems.value[title] = true;
  }
};

const onChildItemClick = (parentTitle: string) => {
  if (!isSidebarOpen.value) {
    setOpen(true);
  }
  openItems.value[parentTitle] = true;
};

const getPermissionProps = (permission?: string | string[]) => {
  if (!permission) return {};
  if (Array.isArray(permission)) {
    return { permissions: permission };
  }
  return { permission: permission };
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push({ name: "Login" });
  } catch (error) {
    console.error(
      "Logout failed:",
      error instanceof Error ? error.message : String(error),
    );
    // Even if logout fails, redirect to login
    router.push({ name: "Login" });
  }
};

interface NavItem {
  title: string;
  url: string;
  icon: unknown;
  permission?: string | string[];
  children?: NavItem[];
}

const navItems = computed(() => {
  const items: NavItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: "lucide:home",
      permission: "dashboard-list",
    },
    {
      title: "Profile",
      url: "/profile",
      icon: "lucide:user",
      permission: "user-update",
    },
  ];

  if (authStore.hasPermission("list-sliders")) {
    items.push({
      title: "Projects",
      url: "/sliders",
      icon: "lucide:landmark",
      permission: "list-sliders",
    });
  }

  if (authStore.hasPermission("list-partners")) {
    items.push({
      title: "Partners",
      url: "/partners",
      icon: "lucide:users",
      permission: "list-partners",
    });
  }

  if (authStore.hasPermission("list-stats")) {
    items.push({
      title: "Stats",
      url: "/stats",
      icon: "lucide:bar-chart",
      permission: "list-stats",
    });
  }

  if (authStore.hasPermission("list-menus")) {
    items.push({
      title: "Menus",
      url: "/menus",
      icon: "lucide:menu",
      permission: "list-menus",
    });
  }

  if (authStore.hasPermission("list-news-notices") && false) {
    items.push({
      title: "News and Notices",
      url: "/news-notices",
      icon: "lucide:newspaper",
      permission: "list-news-notices",
    });
  }

  if (authStore.hasPermission("list-committee-members") && false) {
    items.push({
      title: "Committee Members",
      url: "/committee-members",
      icon: "lucide:users",
      permission: "list-committee-members",
    });
  }

  if (
    authStore.hasAnyPermission(["list-faq-categories", "list-faqs"]) &&
    false
  ) {
    items.push({
      title: "FAQs",
      url: "/",
      icon: "lucide:help-circle",
      permission: ["list-faq-categories", "list-faqs"],
      children: [
        {
          title: "FAQ Categories",
          url: "/faq-categories",
          icon: "lucide:folder",
          permission: "list-faq-categories",
        },
        {
          title: "FAQs",
          url: "/faqs",
          icon: "lucide:message-circle-question",
          permission: "list-faqs",
        },
      ],
    });
  }

  if (
    authStore.hasAnyPermission([
      "list-download-categories",
      "list-downloads",
    ]) &&
    false
  ) {
    items.push({
      title: "Downloads",
      url: "/",
      icon: "lucide:download",
      permission: ["list-download-categories", "list-downloads"],
      children: [
        {
          title: "Download Categories",
          url: "/download-categories",
          icon: "lucide:folder",
          permission: "list-download-categories",
        },
        {
          title: "Downloads",
          url: "/downloads",
          icon: "lucide:file-down",
          permission: "list-downloads",
        },
      ],
    });
  }

  if (authStore.hasPermission("list-contact-us")) {
    items.push({
      title: "Contact",
      url: "/contacts",
      icon: "lucide:phone-call",
      permission: "list-contact-us",
    });
  }

  if (
    authStore.hasAnyPermission(["list-careers", "list-open-careers"]) &&
    false
  ) {
    items.push({
      title: "Careers",
      url: "/",
      icon: "lucide:briefcase",
      permission: ["list-careers", "list-open-careers"],
      children: [
        {
          title: "Career Openings",
          url: "/careers",
          icon: "lucide:briefcase",
          permission: "list-careers",
        },
        {
          title: "Open Career Portal",
          url: "/open-careers",
          icon: "lucide:user-plus",
          permission: "list-open-careers",
        },
      ],
    });
  }

  if (authStore.hasPermission("list-popups")) {
    items.push({
      title: "Popups",
      url: "/popups",
      icon: "lucide:maximize-2",
      permission: "list-popups",
    });
  }

  if (
    authStore.hasAnyPermission([
      "view-users",
      "list-users",
      "create-users",
      "list-settings",
    ])
  ) {
    items.push({
      title: "Admin",
      url: "/",
      icon: "pajamas:admin",
      permission: "list-users",
      children: [
        {
          title: "Users",
          url: "/admin/users",
          icon: "lucide:users",
          permission: "list-users",
        },
        {
          title: "Roles",
          url: "/admin/roles",
          icon: "lucide:shield-check",
          permission: "list-users",
        },
        {
          title: "Settings",
          url: "/admin/settings",
          icon: "lucide:settings",
          permission: "list-settings",
        },
      ],
    });
  }

  return items as NavItem[];
});

const filteredNavItems = computed(() => {
  if (!searchQuery.value) return navItems.value;
  return navItems.value
    .map((item: NavItem) => {
      if (item.children) {
        const filteredChildren = item.children.filter((child: NavItem) =>
          child.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
        );
        if (
          filteredChildren.length ||
          item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
        ) {
          return { ...item, children: filteredChildren as NavItem[] };
        }
        return null;
      }
      return item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
        ? item
        : null;
    })
    .filter((item): item is NonNullable<NavItem> => item !== null);
});

const toggleItem = (title: string) => {
  openItems.value[title] = !openItems.value[title];
};

const isActive = (url: string) => {
  return route.path === url || route.path.startsWith(url + "/");
};

const hasActiveChild = (item: NavItem) => {
  if (!item.children) return false;
  return item.children.some((child: NavItem) => isActive(child.url));
};
</script>

<style scoped>
.bg-sidebar {
  background-color: var(--sidebar);
}

.bg-sidebar-accent {
  background-color: var(--sidebar-accent);
}

.text-sidebar-accent-foreground {
  color: var(--sidebar-accent-foreground);
}

.active {
  background-color: var(--sidebar-primary);
  color: var(--sidebar-primary-foreground);
  font-weight: 500;
  box-shadow: inset 0 0 0 1px oklch(from var(--sidebar-primary) l c h / 0.35);
}

.active svg,
.active span {
  color: var(--sidebar-primary-foreground);
}

.active:hover {
  background-color: oklch(from var(--sidebar-primary) l c h / 0.9);
}

.active-parent {
  background-color: oklch(from var(--sidebar-primary) l c h / 0.15);
  color: var(--sidebar-primary);
  font-weight: 500;
}

.active-parent svg,
.active-parent span {
  color: var(--sidebar-primary);
}

.active-parent:hover {
  background-color: oklch(from var(--sidebar-primary) l c h / 0.25);
}

.sidebar-menu-button {
  color: var(--sidebar-foreground);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.sidebar-menu-button:hover {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}

:deep(.sidebar-collapsed) .active {
  position: relative;
}

:deep(.sidebar-collapsed) .active::after {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background-color: var(--sidebar-primary);
  border-radius: 0 4px 4px 0;
}
</style>
