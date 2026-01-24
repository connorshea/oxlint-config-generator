<script setup lang="ts">
import { ref } from "vue";

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
</script>

<template>
  <div class="section">
    <h2>Generated Config</h2>
    <div class="config-display">
      <button class="copy-button" @click="copyToClipboard">
        {{ copied ? "Copied!" : "Copy" }}
      </button>
      <pre>{{ config }}</pre>
    </div>
    <p class="instructions">
      Copy this configuration and save it as <code>.oxlintrc.json</code> in
      your project root.
    </p>
  </div>
</template>

<style scoped>
.instructions {
  margin-top: 1rem;
  opacity: 0.8;
}

.instructions code {
  background-color: #2a2a2a;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: "Courier New", monospace;
}

@media (prefers-color-scheme: light) {
  .instructions code {
    background-color: #e0e0e0;
  }
}
</style>
