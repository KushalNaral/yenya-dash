import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppLayout from "@/layouts/AppLayout.vue";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import ResetPassword from "@/views/ResetPassword.vue";

const routes = [
  {
    path: "/",
    children: [
      { path: "/", redirect: { name: "Login" } },
      {
        path: "login",
        name: "Login",
        component: Login,
        meta: { requiresGuest: true },
      },
      {
        path: "register",
        name: "Register",
        component: Register,
        meta: { requiresGuest: true },
      },
      {
        path: "forgot-password",
        name: "ForgotPassword",
        component: ForgotPassword,
        meta: { requiresGuest: true },
      },
      {
        path: "reset-password",
        name: "ResetPassword",
        component: ResetPassword,
        meta: { requiresGuest: true },
      },
    ],
  },
  {
    path: "/",
    component: AppLayout,
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard.vue"),
        // meta: { requiresAuth: true, requiredPermission: "dashboard-list" },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/Profile.vue"),
        meta: { requiresAuth: true, requiredPermission: "user-update" },
      },
      {
        path: "setup",
        children: [
          {
            path: "years",
            name: "Year",
            component: () => import("@/views/setup/Year.vue"),
            meta: { requiresAuth: true, requiredPermission: "year-list" },
          },
          {
            path: "province",
            name: "Province",
            component: () => import("@/views/setup/Province.vue"),
            meta: { requiresAuth: true, requiredPermission: "province-list" },
          },
          {
            path: "district",
            name: "District",
            component: () => import("@/views/setup/District.vue"),
            meta: { requiresAuth: true, requiredPermission: "district-list" },
          },
          {
            path: "municipality",
            name: "Municipality",
            component: () => import("@/views/setup/Municipality.vue"),
            meta: {
              requiresAuth: true,
              requiredPermission: "municipality-list",
            },
          },
          {
            path: "aefi",
            name: "AEFI",
            component: () => import("@/views/setup/Aefi.vue"),
            meta: { requiresAuth: true, requiredPermission: "aefi-list" },
          },
          {
            path: "district-population",
            name: "DistrictPopulation",
            component: () => import("@/views/setup/DistrictPopulation.vue"),
            meta: {
              requiresAuth: true,
              requiredPermission: "districtpopulation-list",
            },
          },
          {
            path: "reportingunit",
            name: "ReportingUnit",
            component: () => import("@/views/setup/ReportingUnit.vue"),
            meta: {
              requiresAuth: true,
              requiredPermission: "reportingunit-list",
            },
          },
        ],
      },

      {
        path: "sliders",
        name: "Slider",
        component: () => import("@/views/sliders/Slider.vue"),
      },
      {
        path: "partners",
        name: "Partner",
        component: () => import("@/views/partners/Partner.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-partners" },
      },
      {
        path: "menus",
        name: "Menu",
        component: () => import("@/views/menus/Menu.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-menus" },
      },
      {
        path: "faqs",
        name: "Faq",
        component: () => import("@/views/faqs/Faq.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-faqs" },
      },
      {
        path: "faq-categories",
        name: "FaqCategory",
        component: () => import("@/views/faqCategories/FaqCategory.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-faq-categories" },
      },
      {
        path: "downloads",
        name: "Download",
        component: () => import("@/views/downloads/Download.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-downloads" },
      },
      {
        path: "download-categories",
        name: "DownloadCategory",
        component: () =>
          import("@/views/downloadCategories/DownloadCategory.vue"),
        meta: {
          requiresAuth: true,
          requiredPermission: "list-download-categories",
        },
      },
      {
        path: "contacts",
        name: "ContactUs",
        component: () => import("@/views/contacts/ContactUs.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-contact-us" },
      },
      {
        path: "careers",
        name: "Career",
        component: () => import("@/views/careers/Career.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-careers" },
      },
      {
        path: "open-careers",
        name: "OpenCareer",
        component: () => import("@/views/openCareers/OpenCareer.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-open-careers" },
      },
      {
        path: "popups",
        name: "Popup",
        component: () => import("@/views/popups/Popup.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-popups" },
      },
      {
        path: "committee-members",
        name: "CommitteeMember",
        component: () =>
          import("@/views/committeeMembers/CommitteeMembers.vue"),
        meta: {
          requiresAuth: true,
          requiredPermission: "list-committee-members",
        },
      },
      {
        path: "news-notices",
        name: "NewsNotices",
        component: () => import("@/views/NewsNotices/NewsNotice.vue"),
        meta: { requiresAuth: true, requiredPermission: "list-news-notices" },
      },
      {
        path: "admin",
        children: [
          {
            path: "users",
            name: "UserManagement",
            component: () => import("@/views/admin/UserManagement.vue"),
            meta: { requiresAuth: true, requiredPermission: "list-users" },
          },
          {
            path: "roles",
            name: "RoleManagement",
            component: () => import("@/views/admin/RoleManagement.vue"),
            meta: { requiresAuth: true, requiredPermission: "list-roles" },
          },
          {
            path: "settings",
            name: "Setting",
            component: () => import("@/views/settings/Setting.vue"),
            meta: { requiresAuth: true, requiredPermission: "list-settings" },
          },
        ],
      },
      {
        path: "access-denied",
        name: "AccessDenied",
        component: () => import("@/views/errors/AccessDenied.vue"),
      },
      {
        path: "/:pathMatch(.*)*",
        name: "NotFound",
        component: () => import("@/views/errors/NotFound.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Redirect authenticated users away from guest-only routes
  if (to.meta.requiresGuest && authStore.isAuthenticated && authStore.token) {
    const redirectPath = (to.query.redirect as string) || "/dashboard";
    return next(redirectPath);
  }

  // Redirect unauthenticated users to login for protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "Login", query: { redirect: to.fullPath } });
  }

  // Check permissions for routes requiring specific permissions
  const requiredPermission = to.meta.requiredPermission as string | undefined;
  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    return next({
      name: "AccessDenied",
      query: { from: to.fullPath, permission: requiredPermission },
    });
  }

  scrollTo(0, 0);
  next();
});

export default router;
