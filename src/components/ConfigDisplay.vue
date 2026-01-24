<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  config: string;
}>();

const copied = ref(false);

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.config);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
};

const highlightedConfig = computed(() => {
  // Simple JSON syntax highlighting using a token-based approach
  const keys: string[] = [];
  let result = props.config;

  // 1. Extract and replace keys with placeholders
  result = result.replace(/("(?:\\.|[^"\\])*")\s*:/g, (_, key) => {
    keys.push(key);
    return `__KEY_${keys.length - 1}__:`;
  });

  // 2. Highlight all remaining quoted strings as values
  result = result.replace(/"(?:\\.|[^"\\])*"/g, '<span class="json-string">$&</span>');

  // 3. Restore keys with highlighting
  result = result.replace(/__KEY_(\d+)__/g, (_, index) => {
    return `<span class="json-key">${keys[parseInt(index)]}</span>`;
  });

  // 4. Highlight booleans, null, numbers
  result = result.replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>');
  result = result.replace(/:\s*null/g, ': <span class="json-null">null</span>');
  result = result.replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>');

  // 5. Highlight punctuation
  result = result.replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');

  return result;
});
</script>

<template>
  <div class="section config-section">
    <h2>Generated Config</h2>
    <div class="config-display-wrapper">
      <button class="copy-button-float" @click="copyToClipboard">
        {{ copied ? "✓ Copied!" : "📋 Copy" }}
      </button>
      <div class="config-display">
        <pre><code v-html="highlightedConfig"></code></pre>
      </div>
    </div>
    <p class="instructions">Save as <code>.oxlintrc.json</code> in your project root.</p>
  </div>
</template>

<style scoped>
.instructions {
  margin-top: 1rem;
  opacity: 0.8;
}

.instructions code {
  background-color: var(--color-primary-muted);
  color: var(--color-primary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace;
}

.config-display-wrapper {
  position: relative;
}

.copy-button-float {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.copy-button-float:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

/* JSON Syntax Highlighting */
:deep(.json-key) {
  color: #3b82f6;
}

:deep(.json-string) {
  color: #22c55e;
}

:deep(.json-number) {
  color: #f59e0b;
}

:deep(.json-boolean) {
  color: #a855f7;
}

:deep(.json-null) {
  color: #6b7280;
}

:deep(.json-punctuation) {
  color: var(--color-text-secondary);
}

@media (prefers-color-scheme: light) {
  .instructions code {
    background-color: var(--color-primary-muted);
  }

  :deep(.json-key) {
    color: #2563eb;
  }

  :deep(.json-string) {
    color: #16a34a;
  }

  :deep(.json-number) {
    color: #d97706;
  }

  :deep(.json-boolean) {
    color: #9333ea;
  }

  :deep(.json-null) {
    color: #6b7280;
  }
}
</style>
