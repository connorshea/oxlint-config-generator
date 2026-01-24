<script setup lang="ts">
import type { PluginName } from "../types";

const props = defineProps<{
  selectedPlugins: PluginName[];
}>();

const emit = defineEmits<{
  "update:selectedPlugins": [plugins: PluginName[]];
}>();

const availablePlugins: { name: PluginName; label: string }[] = [
  { name: "eslint", label: "ESLint" },
  { name: "oxc", label: "oxc" },
  { name: "typescript", label: "TypeScript" },
  { name: "unicorn", label: "Unicorn" },
  { name: "react", label: "React" },
  { name: "react-perf", label: "React Perf" },
  { name: "jsx-a11y", label: "JSX Accessibility" },
  { name: "vue", label: "Vue" },
  { name: "next", label: "Next.js" },
  { name: "import", label: "Import" },
  { name: "jsdoc", label: "JSDoc" },
  { name: "jest", label: "Jest" },
  { name: "vitest", label: "Vitest" },
  { name: "promise", label: "Promise" },
  { name: "node", label: "Node.js" },
];

const togglePlugin = (plugin: PluginName) => {
  const index = props.selectedPlugins.indexOf(plugin);
  const newPlugins = [...props.selectedPlugins];

  if (index > -1) {
    newPlugins.splice(index, 1);
  } else {
    newPlugins.push(plugin);
  }

  emit("update:selectedPlugins", newPlugins);
};

const isSelected = (plugin: PluginName) => {
  return props.selectedPlugins.includes(plugin);
};
</script>

<template>
  <div class="section">
    <h2>Select Plugins</h2>
    <p>Choose which plugins you want to include rules from:</p>
    <div class="plugin-selection">
      <button
        v-for="plugin in availablePlugins"
        :key="plugin.name"
        :class="['plugin-button', { selected: isSelected(plugin.name) }]"
        @click="togglePlugin(plugin.name)"
      >
        {{ plugin.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.section p {
  margin-bottom: 1rem;
  opacity: 0.8;
}
</style>
