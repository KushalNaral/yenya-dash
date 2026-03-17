<template>
  <div>
    <div class="editor-wrapper" :class="wrapperClass">
      <div
        :id="editorId"
        class="editor-container border border-border rounded-md focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
        :class="containerClass"
      >
        <echo-editor
          :model-value="modelValue"
          :extensions="extensions"
          :hide-toolbar="hideToolbar"
          :hide-menubar="hideMenubar"
          :disabled="disabled"
          :max-height="512"
          output="html"
          :dark="isDark"
          @update:model-value="handleContentChange"
          @focus="handleFocus"
          @blur="handleBlur"
          @change="handleChange"
        />
      </div>

      <div v-if="error" class="editor-error mt-1">
        <p class="text-sm text-destructive">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { useAuth } from "@/composables/useAuth";
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  Bold,
  BulletList,
  Italic,
  BaseKit,
  Underline,
  Strike,
  LineHeight,
  Image,
  History,
  Heading,
  CodeBlock,
  FontSize,
  Highlight,
  Table,
  Clear,
  Blockquote,
  Link,
  Color,
  Video,
  OrderedList,
  HorizontalRule,
  Fullscreen,
  TaskList,
  MoreMark,
  FormatPainter,
  SlashCommand,
  Indent,
  locale,
  Columns,
  TextAlign,
  // ImageUpload,
  FontFamily,
  FindAndReplace,
  Code,
  Preview,
  Printer,
  Iframe,
  EchoEditor,
} from "echo-editor";
import "echo-editor/style.css";

import type { JSONContent } from "@tiptap/core";
const hideToolbar = ref<boolean>(false);
const hideMenubar = ref<boolean>(true);

const isDark = computed(() => {
  return document.documentElement.classList.contains("dark");
});

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  editable?: boolean;
  error?: string;
  helpText?: string;
  height?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  wrapperClass?: string;
  containerClass?: string;
  editorClass?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  label: "",
  placeholder: "Start writing...",
  required: false,
  disabled: false,
  editable: true,
  error: "",
  helpText: "",
  height: "auto",
  minHeight: "120px",
  maxHeight: "400px",
  wrapperClass: "",
  containerClass: "",
  editorClass: "",
  maxLength: undefined,
  showCharCount: false,
});

interface Emits {
  "update:modelValue": [value: string | JSONContent];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  change: [value: string | JSONContent];
  "char-count": [count: number];
}

const emit = defineEmits<Emits>();

const content = ref<string | JSONContent>(props.modelValue);
const editorId = ref(`editor-${Math.random().toString(36).substr(2, 9)}`);

const extensions = computed(() => {
  return [
    BaseKit.configure({
      placeholder: {
        showOnlyCurrent: true,
      },
      characterCount: {
        limit: 50000,
      },
    }),
    History,
    Columns,
    FormatPainter,
    Clear,
    Heading.configure({ spacer: true }),
    FontSize,
    FontFamily,
    Bold,
    Italic,
    Underline,
    Strike,
    MoreMark,
    Color.configure({ spacer: true }),
    Highlight,
    BulletList,
    OrderedList,
    TextAlign.configure({
      types: ["heading", "paragraph", "image"],
      spacer: true,
    }),
    Indent,
    LineHeight,
    TaskList.configure({
      spacer: true,
      taskItem: {
        nested: true,
      },
    }),
    Link,
    Image,
    // ImageUpload.configure({
    //   upload: async (file: File): Promise<string> => {
    //     const formData = new FormData();
    //     formData.append("file", file);

    //     const API_URL = import.meta.env.VITE_API_URL as string;
    //     const authStore = useAuth();

    //     const response = await fetch(API_URL + "common/upload-image", {
    //       method: "POST",
    //       body: formData,
    //       credentials: "include",
    //       headers: {
    //         Authorization: `Bearer ${authStore.token}`,
    //       },
    //     });

    //     if (!response.ok) {
    //       throw new Error("Upload failed");
    //     }

    //     const data = await response.json();
    //     return data.url; // This will be a real, permanent URL
    //   },
    // }),
    Video,
    Blockquote,
    SlashCommand,
    HorizontalRule,
    Fullscreen.configure({ spacer: true }),
    CodeBlock.configure({ spacer: true }),
    Table,
    Code,
    FindAndReplace.configure({ spacer: true }),
    Printer,
    Preview,
    Iframe,
  ];
});

const charCount = computed(() => {
  return content.value.length;
});

onMounted(() => {
  locale.setLang("en");
});

const handleContentChange = (value: string | JSONContent) => {
  if (props.maxLength && value.length > props.maxLength) {
    return; // Don't update if over limit
  }

  content.value = value;
  emit("update:modelValue", value);
  emit("change", value);
  emit("char-count", charCount.value);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const handleChange = (value: string) => {
  emit("change", value);
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== content.value) {
      content.value = newValue;
    }
  },
);

const fixButtonTypes = () => {
  const editorElement = document.getElementById(editorId.value);
  if (!editorElement) return;

  const linkInputSelector =
    'input[name="href"], input[name="url"], input[type="url"], ' +
    'input[placeholder*="URL"], input[placeholder*="url"], input[placeholder*="Link"], input[placeholder*="link"], input[placeholder*="http"]';

  const isLinkDialogForm = (form: Element) =>
    !!form.querySelector(linkInputSelector);

  const isInsideLinkDialog = (button: Element) => {
    const form = button.closest("form");
    if (form && isLinkDialogForm(form)) return true;
    const open = button.closest("[data-state='open']");
    return !!(open && open.querySelector(linkInputSelector));
  };

  const buttons = editorElement.querySelectorAll("button");
  buttons.forEach((button) => {
    if (isInsideLinkDialog(button)) return;

    if (!button.hasAttribute("type")) {
      button.setAttribute("type", "button");
    }
    if (!button.hasAttribute("data-editor-fix-applied")) {
      button.setAttribute("data-editor-fix-applied", "true");
      button.addEventListener("click", (e) => {
        if (button.type === "submit" || !button.type) {
          e.preventDefault();
        }
      });
    }
  });
};

onMounted(() => {
  content.value = props.modelValue;
  setTimeout(fixButtonTypes, 100);

  const editorElement = document.getElementById(editorId.value);
  if (editorElement) {
    const observer = new MutationObserver(() => {
      fixButtonTypes();
    });

    observer.observe(editorElement, {
      childList: true,
      subtree: true,
    });

    onUnmounted(() => {
      observer.disconnect();
    });
  }
});

defineExpose({
  focus: () => {
    const editorElement = document.getElementById(editorId.value);
    if (editorElement) {
      editorElement.focus();
    }
  },
  clear: () => {
    content.value = "";
    emit("update:modelValue", "");
  },
  getContent: () => content.value,
  setContent: (value: string | JSONContent) => {
    content.value = value;
    emit("update:modelValue", value);
  },
});
</script>

<style scoped>
/* Editor component styles */
</style>
