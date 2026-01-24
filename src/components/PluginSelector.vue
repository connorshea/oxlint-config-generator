<script setup lang="ts">
import { ref } from "vue";
import type { PluginName } from "../types";

const props = defineProps<{
  selectedPlugins: PluginName[];
}>();

const emit = defineEmits<{
  "update:selectedPlugins": [plugins: PluginName[]];
}>();

interface PluginCategory {
  title: string;
  plugins: { name: PluginName; label: string }[];
}

interface AdditionalPlugin {
  name: string;
  label: string;
  npmPackage: string;
}

const additionalJSPlugins: AdditionalPlugin[] = [
  { name: "playwright", label: "Playwright", npmPackage: "eslint-plugin-playwright" },
  {
    name: "testing-library",
    label: "Testing Library",
    npmPackage: "eslint-plugin-testing-library",
  },
  { name: "stylistic", label: "Stylistic", npmPackage: "@stylistic/eslint-plugin" },
  { name: "storybook", label: "Storybook", npmPackage: "eslint-plugin-storybook" },
];

const showAdditionalPlugins = ref(false);

const pluginCategories: PluginCategory[] = [
  {
    title: "Default",
    plugins: [
      { name: "eslint", label: "ESLint" },
      { name: "oxc", label: "oxc" },
      { name: "typescript", label: "TypeScript" },
    ],
  },
  {
    title: "Frameworks",
    plugins: [
      { name: "react", label: "React" },
      { name: "react-perf", label: "React Perf" },
      { name: "jsx-a11y", label: "JSX Accessibility" },
      { name: "vue", label: "Vue" },
      { name: "next", label: "Next.js" },
    ],
  },
  {
    title: "Testing",
    plugins: [
      { name: "jest", label: "Jest" },
      { name: "vitest", label: "Vitest" },
    ],
  },
  {
    title: "Misc.",
    plugins: [
      { name: "unicorn", label: "Unicorn" },
      { name: "import", label: "Import" },
      { name: "jsdoc", label: "JSDoc" },
      { name: "promise", label: "Promise" },
      { name: "node", label: "Node.js" },
    ],
  },
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

const toggleAdditionalPlugins = () => {
  showAdditionalPlugins.value = !showAdditionalPlugins.value;
};
</script>

<template>
  <div>
    <h2>Select Plugins</h2>
    <p class="plugin-description">Choose which plugins you want to include rules from:</p>
    <div class="plugin-categories">
      <div v-for="category in pluginCategories" :key="category.title" class="plugin-category">
        <h3 class="category-title">{{ category.title }}</h3>
        <div class="plugin-selection">
          <button
            v-for="plugin in category.plugins"
            :key="plugin.name"
            :class="['plugin-button', { selected: isSelected(plugin.name) }]"
            @click="togglePlugin(plugin.name)"
          >
            {{ plugin.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="additional-plugins-section">
      <button class="additional-plugins-toggle" @click="toggleAdditionalPlugins">
        {{ showAdditionalPlugins ? "−" : "+" }} Additional JS Plugins (Coming Soon)
      </button>
      <div v-if="showAdditionalPlugins" class="additional-plugins-info">
        <p class="info-text">
          The following ESLint plugins are not yet supported by Oxlint, but may be added in the
          future:
        </p>
        <ul class="plugin-list">
          <li v-for="plugin in additionalJSPlugins" :key="plugin.name" class="plugin-list-item">
            <strong>{{ plugin.label }}</strong>
            <code class="npm-package">{{ plugin.npmPackage }}</code>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plugin-description {
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.plugin-categories {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.plugin-category {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0;
}

.plugin-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.additional-plugins-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.additional-plugins-toggle {
  width: 100%;
  text-align: left;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--color-text-secondary);
}

.additional-plugins-toggle:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border-color: var(--color-border-hover);
}

.additional-plugins-info {
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--color-bg-hover);
  border-radius: 6px;
}

.info-text {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.plugin-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plugin-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  padding: 0.5rem;
  background: var(--color-bg-elevated);
  border-radius: 4px;
}

.plugin-list-item strong {
  color: var(--color-text);
  min-width: 120px;
}

.npm-package {
  font-family: "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-code-bg);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  border: 1px solid var(--color-border);
}
</style>
