import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import { Toaster } from "vue-sonner";
import { Icon } from "@iconify/vue";
import draggable from "vuedraggable";

//Global Components
import ErrorViewer from "./components/custom/jsx/errors/ErrorViewer.vue";
import CustomConfirmDialog from "./components/custom/CustomConfirmDialog.vue";
import CustomMultiSelect from "./components/custom/CustomMultiSelect.vue";
import DialogFormWrapper from "./components/custom/DialogFormWrapper.vue";
import FormBuilder from "./components/builders/FormBuilder.vue";
import PermissionGuard from "./components/guards/PermissionGuard.vue";

import "./style.css";

function initializeApp(): void {
  const pinia = createPinia();
  const app = createApp(App);

  app.use(router);
  app.use(pinia);
  pinia.use(piniaPluginPersistedstate);

  app.component("Toaster", Toaster);
  app.component("ErrorViewer", ErrorViewer);
  app.component("DeleteConfirmDialog", CustomConfirmDialog);
  app.component("MultiSelect", CustomMultiSelect);
  app.component("PermissionGuard", PermissionGuard);
  app.component("FormBuilder", FormBuilder);
  app.component("FormWrapper", DialogFormWrapper);
  app.component("Iconify", Icon);
  app.component("VueDraggable", draggable);
  app.mount("#app");

  const authStore = useAuthStore();
  authStore.initialize();
}

initializeApp();
