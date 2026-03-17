<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto p-4">
      <!-- Header -->
      <header class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-foreground tracking-tight">Your Profile</h1>
          <p class="text-muted-foreground mt-2 text-sm">
            Manage your account details, tasks, notifications, and institutions
          </p>
        </div>
        <Button
          variant="outline"
          class="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
          @click="router.push({ name: 'Dashboard' })"
        >
          Back to Dashboard
        </Button>
      </header>

      <!-- Main Content -->
      <div
        v-if="authStore.isAuthenticated && authStore.user"
        class="grid grid-cols-1 lg:grid-cols-4 gap-6"
      >
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-1 bg-card rounded-lg shadow-md p-6 sticky top-6">
          <nav class="space-y-2">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="w-full cursor-pointer text-left px-4 py-3 rounded-md text-foreground font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-105"
              :class="{
                'bg-gradient-to-r from-primary/20 to-primary/10 text-primary':
                  activeTab === tab.value,
              }"
              @click="activeTab = tab.value"
            >
              <component :is="tab.icon" class="inline-block h-5 w-5 mr-2" />
              {{ tab.label }}
            </button>
          </nav>
        </aside>

        <!-- Content Area -->
        <main class="lg:col-span-3 space-y-6">
          <!-- Personal Information -->
          <div
            v-if="activeTab === 'personal'"
            class="bg-card rounded-lg shadow-md p-6 animate-table-row"
          >
            <h2 class="text-2xl font-semibold text-foreground mb-6">Personal Information</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <Label class="text-sm font-medium text-foreground">Name</Label>
                <p class="text-muted-foreground">{{ authStore.user.name }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-foreground">Email</Label>
                <p class="text-muted-foreground">{{ authStore.user.email }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-foreground">Roles</Label>
                <p class="text-muted-foreground">{{ authStore.user.roles.join(", ") || "None" }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-foreground">Permissions</Label>
                <p class="text-muted-foreground">
                  {{ authStore.user.permissions.join(", ") || "None" }}
                </p>
              </div>
              <div>
                <Label class="text-sm font-medium text-foreground">Account Created</Label>
                <p class="text-muted-foreground">{{ formatDate(userDetails.createdAt) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-foreground">Last Login</Label>
                <p class="text-muted-foreground">{{ formatDate(userDetails.lastLogin) }}</p>
              </div>
            </div>
            <form @submit.prevent="updateProfile" class="space-y-6">
              <div>
                <Label for="name" class="text-sm font-medium text-foreground">Update Name</Label>
                <Input
                  id="name"
                  v-model="form.name"
                  type="text"
                  placeholder="Enter your name"
                  class="mt-1 bg-card border-input focus:ring-ring transition-all duration-200"
                />
              </div>
              <div>
                <Label for="email" class="text-sm font-medium text-foreground">Update Email</Label>
                <Input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email"
                  class="mt-1 bg-card border-input focus:ring-ring transition-all duration-200"
                />
              </div>
              <div class="flex items-center gap-4">
                <Button
                  type="submit"
                  :disabled="isLoading"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin mr-2" />
                  Update Profile
                </Button>
                <p v-if="errorMessage" class="text-destructive text-sm">{{ errorMessage }}</p>
                <p v-if="successMessage" class="text-green-500 text-sm">{{ successMessage }}</p>
              </div>
            </form>
          </div>

          <!-- Change Password -->
          <div
            v-if="activeTab === 'password'"
            class="bg-card rounded-lg shadow-md p-6 animate-table-row"
          >
            <h2 class="text-2xl font-semibold text-foreground mb-6">Change Password</h2>
            <form @submit.prevent="updatePassword" class="space-y-6">
              <div>
                <Label for="current-password" class="text-sm font-medium text-foreground"
                  >Current Password</Label
                >
                <Input
                  id="current-password"
                  v-model="passwordForm.currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  class="mt-1 bg-card border-input focus:ring-ring transition-all duration-200"
                />
              </div>
              <div>
                <Label for="new-password" class="text-sm font-medium text-foreground"
                  >New Password</Label
                >
                <Input
                  id="new-password"
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="Enter new password"
                  class="mt-1 bg-card border-input focus:ring-ring transition-all duration-200"
                />
              </div>
              <div>
                <Label for="confirm-password" class="text-sm font-medium text-foreground"
                  >Confirm New Password</Label
                >
                <Input
                  id="confirm-password"
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  class="mt-1 bg-card border-input focus:ring-ring transition-all duration-200"
                />
              </div>
              <div class="flex items-center gap-4">
                <Button
                  type="submit"
                  :disabled="isPasswordLoading"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  <Loader2 v-if="isPasswordLoading" class="h-4 w-4 animate-spin mr-2" />
                  Change Password
                </Button>
                <p v-if="passwordErrorMessage" class="text-destructive text-sm">
                  {{ passwordErrorMessage }}
                </p>
                <p v-if="passwordSuccessMessage" class="text-green-500 text-sm">
                  {{ passwordSuccessMessage }}
                </p>
              </div>
            </form>
          </div>

          <!-- Activity Log -->
          <div
            v-if="activeTab === 'activity'"
            class="bg-card rounded-lg shadow-md p-6 animate-table-row"
          >
            <h2 class="text-2xl font-semibold text-foreground mb-6">Recent Activity</h2>
            <div
              v-if="activityLog.length"
              class="space-y-4 custom-scrollbar max-h-[500px] overflow-y-auto"
            >
              <div
                v-for="(activity, index) in activityLog"
                :key="index"
                class="flex items-start gap-3 p-4 bg-muted/20 rounded-md animate-table-row"
              >
                <component :is="activity.icon" class="h-5 w-5 text-primary" />
                <div>
                  <p class="text-sm text-foreground">{{ activity.description }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatDate(activity.timestamp) }}</p>
                </div>
              </div>
            </div>
            <p v-else class="text-muted-foreground text-sm">No recent activity found.</p>
          </div>

          <!-- Notifications -->
          <div
            v-if="activeTab === 'notifications'"
            class="bg-card rounded-lg shadow-md p-6 animate-table-row"
          >
            <h2 class="text-2xl font-semibold text-foreground mb-6">Notifications</h2>
            <div
              v-if="notifications.length"
              class="space-y-4 custom-scrollbar max-h-[500px] overflow-y-auto"
            >
              <div
                v-for="(notification, index) in notifications"
                :key="index"
                class="flex items-center gap-3 p-4 bg-muted/20 rounded-md animate-table-row"
              >
                <component :is="notification.icon" class="h-5 w-5" :class="notification.color" />
                <div>
                  <p class="text-sm text-foreground">{{ notification.message }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDate(notification.timestamp) }}
                  </p>
                </div>
                <Button
                  v-if="!notification.read"
                  variant="outline"
                  size="sm"
                  class="ml-auto hover:bg-primary/10 hover:text-primary"
                  @click="markNotificationRead(index)"
                >
                  Mark as Read
                </Button>
              </div>
            </div>
            <p v-else class="text-muted-foreground text-sm">No notifications found.</p>
          </div>

          <!-- To-Do List -->
          <div
            v-if="activeTab === 'todo'"
            class="bg-card rounded-lg shadow-md p-6 animate-table-row"
          >
            <h2 class="text-2xl font-semibold text-foreground mb-6">To-Do List</h2>
            <form @submit.prevent="addTodo" class="flex gap-2 mb-6">
              <Input
                v-model="newTodo"
                placeholder="Add a new task"
                class="bg-card border-input focus:ring-ring transition-all duration-200"
              />
              <Button
                type="submit"
                class="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
              >
                Add
              </Button>
            </form>
            <div
              v-if="todoList.length"
              class="space-y-4 custom-scrollbar max-h-[500px] overflow-y-auto"
            >
              <div
                v-for="(todo, index) in todoList"
                :key="index"
                class="flex items-center gap-3 p-4 bg-muted/20 rounded-md animate-table-row"
              >
                <input
                  type="checkbox"
                  v-model="todo.completed"
                  class="h-5 w-5 text-primary rounded border-input focus:ring-ring"
                  @change="updateTodoStatus(index)"
                />
                <p
                  class="text-sm text-foreground flex-1"
                  :class="{ 'line-through text-muted-foreground': todo.completed }"
                >
                  {{ todo.task }}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  class="ml-auto hover:bg-destructive/90 hover:scale-105"
                  @click="deleteTodo(index)"
                >
                  Delete
                </Button>
              </div>
            </div>
            <p v-else class="text-muted-foreground text-sm">
              No tasks found. Add a task to get started!
            </p>
          </div>
        </main>
      </div>

      <!-- Unauthenticated State -->
      <div v-else class="bg-card rounded-lg shadow-md p-6 text-center animate-table-row">
        <h2 class="text-2xl font-semibold text-foreground mb-4">Access Denied</h2>
        <p class="text-muted-foreground mb-6">Please log in to view your profile.</p>
        <Button
          as-child
          class="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        >
          <router-link to="/login">Go to Login</router-link>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  User,
  Lock,
  History,
  Bell,
  AlertCircle,
  CheckCircle,
  CheckSquare,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { resetPassword, updateUser } from "@/services/authService";

const authStore = useAuthStore();
const router = useRouter();

// Tab navigation
const tabs = [
  { value: "personal", label: "Personal Info", icon: User },
  { value: "password", label: "Password", icon: Lock },
  { value: "activity", label: "Activity Log", icon: History },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "todo", label: "To-Do List", icon: CheckSquare },
];
const activeTab = ref("personal");

// Form states
const form = ref({
  name: authStore.user?.first_name || "",
  email: authStore.user?.email || "",
});
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const isLoading = ref(false);
const isPasswordLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const passwordErrorMessage = ref("");
const passwordSuccessMessage = ref("");

// Dummy user details (replace with API data)
const userDetails = ref({
  createdAt: new Date("2023-01-15T10:00:00Z"),
  lastLogin: new Date("2025-08-12T14:30:00Z"),
});

// Dummy activity log
const activityLog = ref([
  { description: "Logged in", timestamp: new Date("2025-08-12T14:30:00Z"), icon: History },
  { description: "Updated profile", timestamp: new Date("2025-08-09T09:15:00Z"), icon: User },
  { description: "Registered account", timestamp: new Date("2023-01-15T10:00:00Z"), icon: User },
]);

// Dummy notifications
const notifications = ref([
  {
    message: "System maintenance scheduled for tomorrow",
    timestamp: new Date("2025-08-13T08:00:00Z"),
    read: false,
    icon: AlertCircle,
    color: "text-destructive",
  },
  {
    message: "New feature released: Task Manager",
    timestamp: new Date("2025-08-12T12:00:00Z"),
    read: false,
    icon: Bell,
    color: "text-primary",
  },
  {
    message: "Profile update successful",
    timestamp: new Date("2025-08-09T09:15:00Z"),
    read: true,
    icon: CheckCircle,
    color: "text-green-500",
  },
]);

// Dummy to-do list
const todoList = ref([
  { task: "Complete project report", completed: false },
  { task: "Review team feedback", completed: true },
]);
const newTodo = ref("");

// Format date helper
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Update profile
const updateProfile = async () => {
  if (!authStore.user) return;

  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const updatedUser = await updateUser(authStore.user.id.toString(), {
      name: form.value.name,
      email: form.value.email,
    });
    authStore.user = { ...authStore.user, ...updatedUser };
    successMessage.value = "Profile updated successfully";
    form.value.name = updatedUser.name;
    form.value.email = updatedUser.email;
    activityLog.value.unshift({
      description: "Updated profile",
      timestamp: new Date(),
      icon: User,
    });
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Failed to update profile";
  } finally {
    isLoading.value = false;
  }
};

// Update password
const updatePassword = async () => {
  if (!authStore.user) return;

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrorMessage.value = "New password and confirmation do not match";
    return;
  }

  isPasswordLoading.value = true;
  passwordErrorMessage.value = "";
  passwordSuccessMessage.value = "";

  try {
    await resetPassword({
      email: authStore.user.email,
      token: "",
      password: passwordForm.value.newPassword,
      password_confirmation: passwordForm.value.confirmPassword,
    });
    passwordSuccessMessage.value = "Password updated successfully";
    passwordForm.value = { currentPassword: "", newPassword: "", confirmPassword: "" };
    activityLog.value.unshift({
      description: "Changed password",
      timestamp: new Date(),
      icon: Lock,
    });
  } catch (error) {
    passwordErrorMessage.value =
      error instanceof Error ? error.message : "Failed to update password";
  } finally {
    isPasswordLoading.value = false;
  }
};

// To-Do List methods
const addTodo = () => {
  if (newTodo.value.trim()) {
    todoList.value.unshift({ task: newTodo.value, completed: false });
    newTodo.value = "";
  }
};

const updateTodoStatus = (index: number) => {
  todoList.value[index].completed = !todoList.value[index].completed;
};

const deleteTodo = (index: number) => {
  todoList.value.splice(index, 1);
};

// Notification methods
const markNotificationRead = (index: number) => {
  notifications.value[index].read = true;
};

// Redirect to login if not authenticated
if (!authStore.isAuthenticated) {
  router.push({ name: "Login" });
}
</script>

<style scoped>
.animate-table-row {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
