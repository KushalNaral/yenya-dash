<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { register } from "@/services/authService";
import {
  Form,
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
import { LucideUser, LucideMail, LucideLock } from "lucide-vue-next";
import { useErrorHandler } from "@/composables/useErrorHandler";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import { CreateUser } from "@/types/users/createUser";

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(false);
const { handleResponse, getErrorSummary, showErrorDetails } = useErrorHandler();

const schema = toTypedSchema(
  z
    .object({
      name: z
        .string()
        .min(1, "Full name is required")
        .max(255, "Name must not exceed 255 characters"),
      email: z
        .string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .min(1, "Password is required"),
      passwordConfirmation: z
        .string()
        .min(1, "Password confirmation is required"),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: "Passwords must match",
      path: ["passwordConfirmation"],
    }),
);

const form = useForm({
  validationSchema: schema,
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    console.log("Submitting register form with:", values);

    const payload = {
      email: values.email,
      password: values.password,
    };
    const response = await register(payload as CreateUser);
    handleResponse(response);

    console.log("Registration successful, redirecting to dashboard");
    router.push("/dashboard");
  } catch (e: any) {
    console.log("Register error caught:", e);
    form.setErrors({ email: e.message });
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg border-t-4 border-accent"
    >
      <div class="text-center">
        <img
          src="/src/assets/images/logo.png"
          alt="MCL Logo"
          class="mx-auto h-12 w-auto"
        />
        <h2 class="mt-6 text-3xl font-extrabold text-foreground">
          YenyaSoft Dashboard
        </h2>
        <p class="mt-2 text-sm text-muted-foreground">Create your account</p>
      </div>
      <form :validation-schema="schema" @submit="onSubmit">
        <div class="space-y-6">
          <FormField v-slot="{ componentField, errorMessage }" name="name">
            <FormItem>
              <FormLabel class="text-foreground">Full Name</FormLabel>
              <FormControl>
                <div class="relative">
                  <LucideUser
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  />
                  <Input
                    v-bind="componentField"
                    type="text"
                    placeholder="Full Name"
                    class="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage
                v-if="errorMessage"
                class="text-destructive text-sm"
              />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField, errorMessage }" name="email">
            <FormItem>
              <FormLabel class="text-foreground">Email address</FormLabel>
              <FormControl>
                <div class="relative">
                  <LucideMail
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  />
                  <Input
                    v-bind="componentField"
                    type="email"
                    placeholder="Email address"
                    class="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage
                v-if="errorMessage"
                class="text-destructive text-sm"
              />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField, errorMessage }" name="password">
            <FormItem>
              <FormLabel class="text-foreground">Password</FormLabel>
              <FormControl>
                <div class="relative">
                  <LucideLock
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  />
                  <Input
                    v-bind="componentField"
                    type="password"
                    placeholder="Password"
                    class="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage
                v-if="errorMessage"
                class="text-destructive text-sm"
              />
            </FormItem>
          </FormField>
          <FormField
            v-slot="{ componentField, errorMessage }"
            name="passwordConfirmation"
          >
            <FormItem>
              <FormLabel class="text-foreground">Confirm Password</FormLabel>
              <FormControl>
                <div class="relative">
                  <LucideLock
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  />
                  <Input
                    v-bind="componentField"
                    type="password"
                    placeholder="Confirm Password"
                    class="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage
                v-if="errorMessage"
                class="text-destructive text-sm"
              />
            </FormItem>
          </FormField>
          <Collapsible
            v-if="showErrorDetails && getErrorSummary()"
            class="mt-2"
          >
            <CollapsibleTrigger
              class="flex items-center text-sm text-primary hover:text-primary/80"
            >
              <span>More Details</span>
              <component
                :is="showErrorDetails ? ChevronUp : ChevronDown"
                class="ml-2 h-4 w-4"
              />
            </CollapsibleTrigger>
            <CollapsibleContent class="mt-2 text-sm text-muted-foreground">
              <p class="font-medium">Error: {{ getErrorSummary()?.message }}</p>
              <p v-if="getErrorSummary()?.details" class="mt-1">
                Details: {{ getErrorSummary()?.details }}
              </p>
              <p
                v-if="getErrorSummary()?.hasValidationErrors"
                class="font-medium mt-2"
              >
                Validation Errors:
              </p>
              <ul
                v-if="getErrorSummary()?.hasValidationErrors"
                class="list-disc pl-5 mt-1"
              >
                <li
                  v-for="[field, messages] in Object.entries(
                    getErrorSummary()?.validationErrors || {},
                  )"
                  :key="field"
                >
                  {{ field }}: {{ messages.join(", ") }}
                </li>
              </ul>
              <p class="font-medium mt-2">Next Steps:</p>
              <ul class="list-disc pl-5 mt-1">
                <li v-for="step in getErrorSummary()?.nextSteps" :key="step">
                  {{ step }}
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
          <Button
            type="submit"
            class="w-full"
            variant="default"
            :disabled="isLoading"
          >
            {{ isLoading ? "Registering..." : "Register" }}
          </Button>
        </div>
      </form>
      <div class="text-center mt-4">
        <p class="text-sm text-muted-foreground">
          Already have an account?
          <router-link
            to="/login"
            class="font-medium text-primary hover:text-primary/80"
          >
            Sign in here
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
