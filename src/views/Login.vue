<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { useErrorHandler } from "@/composables/useErrorHandler";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isLoading = ref(false);
const { getErrorSummary } = useErrorHandler();
const showErrorDetails = ref(false);

const schema = toTypedSchema(
  z.object({
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .min(1, "Password is required"),
  }),
);

const form = useForm({
  validationSchema: schema,
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    await authStore.login(values.email, values.password);
    const redirectPath = (route.query.redirect as string) || "/dashboard";
    router.push(redirectPath);
  } catch (e: unknown) {
    const error = e as { message?: string };
    form.setErrors({ email: error.message || "An error occurred" });
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
  >
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
      />
      <div
        class="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"
      />
    </div>

    <div
      class="max-w-lg w-full space-y-8 bg-card/90 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-border/50 relative z-10"
    >
      <div class="text-center space-y-4">
        <div class="inline-flex items-center justify-center bg-primary/10 mb-4">
          <img
            src="/src/assets/images/logo.png"
            alt="YenyaSoft Logo"
            class="w-64 h-auto"
          />
        </div>
        <div>
          <h1 class="text-4xl font-bold text-primary mb-2">
            YenyaSoft Dashboard
          </h1>
          <h2 class="text-xl font-semibold text-foreground">YenyaSoft</h2>
        </div>
        <p class="text-sm text-muted-foreground">
          Sign in to access the dashboard
        </p>
      </div>

      <form :validation-schema="schema" @submit="onSubmit" class="space-y-6">
        <FormField v-slot="{ componentField, errorMessage }" name="email">
          <FormItem>
            <FormLabel class="text-foreground text-base font-medium">
              Email Address
            </FormLabel>
            <FormControl>
              <div class="relative group">
                <Iconify
                  icon="mdi:email"
                  class="absolute z-20 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-300 group-focus-within:text-primary group-focus-within:scale-110"
                />
                <Input
                  v-bind="componentField"
                  type="email"
                  placeholder="Enter your email"
                  class="pl-12 h-12 border-2 transition-all duration-300 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </FormControl>
            <FormMessage v-if="errorMessage" class="text-destructive text-sm" />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField, errorMessage }" name="password">
          <FormItem>
            <FormLabel class="text-foreground text-base font-medium"
              >Password</FormLabel
            >
            <FormControl>
              <div class="relative group">
                <Iconify
                  icon="mdi:lock"
                  class="absolute z-20 left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-300 group-focus-within:text-primary group-focus-within:scale-110"
                />
                <Input
                  v-bind="componentField"
                  type="password"
                  placeholder="Enter your password"
                  class="pl-12 h-12 border-2 transition-all duration-300 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </FormControl>
            <FormMessage v-if="errorMessage" class="text-destructive text-sm" />
          </FormItem>
        </FormField>

        <Collapsible v-if="showErrorDetails && getErrorSummary()" class="mt-2">
          <CollapsibleTrigger
            class="flex items-center text-sm text-primary hover:text-primary/80 cursor-pointer transition-colors"
          >
            <span>More Details</span>
            <Iconify
              icon="mdi:chevron-down"
              class="ml-2 h-4 w-4 transition-transform duration-200"
              :class="{ 'rotate-180': showErrorDetails }"
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            class="mt-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20 text-sm text-foreground"
          >
            <p class="font-semibold text-destructive">
              Error: {{ getErrorSummary()?.message }}
            </p>
            <p
              v-if="getErrorSummary()?.details"
              class="mt-2 text-muted-foreground"
            >
              Details: {{ getErrorSummary()?.details }}
            </p>
            <div v-if="getErrorSummary()?.hasValidationErrors" class="mt-3">
              <p class="font-semibold mb-2">Validation Errors:</p>
              <ul class="space-y-1">
                <li
                  v-for="[field, messages] in Object.entries(
                    getErrorSummary()?.validationErrors || {},
                  )"
                  :key="field"
                  class="flex gap-2"
                >
                  <span class="text-destructive">•</span>
                  <span
                    ><strong>{{ field }}:</strong>
                    {{ messages.join(", ") }}</span
                  >
                </li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div class="flex items-center justify-end">
          <router-link
            to="/forgot-password"
            class="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer transition-colors"
          >
            Forgot your password?
          </router-link>
        </div>

        <Button
          type="submit"
          class="w-full h-12 text-base font-semibold cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20"
          variant="default"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">Sign In</span>
          <span v-else class="flex items-center justify-center gap-2">
            <Iconify icon="mdi:loading" class="animate-spin h-5 w-5" />
            Signing in...
          </span>
        </Button>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
