<script setup lang="ts">
import { ref } from "vue";
import type { PluginName, JSPluginName } from "../types";

const props = defineProps<{
  selectedPlugins: PluginName[];
  selectedJsPlugins: JSPluginName[];
}>();

const emit = defineEmits<{
  "update:selectedPlugins": [plugins: PluginName[]];
  "update:selectedJsPlugins": [plugins: JSPluginName[]];
}>();

interface PluginCategory {
  title: string;
  plugins: { name: PluginName; label: string }[];
}

interface JSPlugin {
  name: JSPluginName;
  label: string;
  npmPackage: string;
}

const availableJSPlugins: JSPlugin[] = [
  { name: "playwright", label: "Playwright", npmPackage: "eslint-plugin-playwright" },
  { name: "stylistic", label: "Stylistic", npmPackage: "@stylistic/eslint-plugin" },
  { name: "storybook", label: "Storybook", npmPackage: "eslint-plugin-storybook" },
  {
    name: "testing-library",
    label: "Testing Library",
    npmPackage: "eslint-plugin-testing-library",
  },
  { name: "cypress", label: "Cypress", npmPackage: "eslint-plugin-cypress" },
];

const showJSPlugins = ref(false);

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

const toggleJSPlugin = (plugin: JSPluginName) => {
  const index = props.selectedJsPlugins.indexOf(plugin);
  const newPlugins = [...props.selectedJsPlugins];

  if (index > -1) {
    newPlugins.splice(index, 1);
  } else {
    newPlugins.push(plugin);
  }

  emit("update:selectedJsPlugins", newPlugins);
};

const isJSPluginSelected = (plugin: JSPluginName) => {
  return props.selectedJsPlugins.includes(plugin);
};

const toggleJSPluginsSection = () => {
  showJSPlugins.value = !showJSPlugins.value;
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

    <div class="js-plugins-section">
      <button
        class="js-plugins-toggle"
        @click="toggleJSPluginsSection"
        title="JavaScript plugin support works but is still experimental"
      >
        <span class="js-plugins-toggle-text"
          >{{ showJSPlugins ? "−" : "+" }} JS Plugins (ESLint Compatibility)</span
        >
        <span class="experimental-badge">Experimental</span>
      </button>
      <div v-if="showJSPlugins" class="js-plugins-content">
        <p class="info-text">
          Oxlint can use existing ESLint plugins via its ESLint API compatibility. Select plugins to
          include:
        </p>
        <div class="plugin-selection js-plugin-selection">
          <button
            v-for="plugin in availableJSPlugins"
            :key="plugin.name"
            :class="[
              'plugin-button',
              'js-plugin-button',
              { selected: isJSPluginSelected(plugin.name) },
            ]"
            @click="toggleJSPlugin(plugin.name)"
            :title="plugin.npmPackage"
          >
            {{ plugin.label }}
          </button>
        </div>
        <p class="js-plugins-note">
          You will need to install the selected plugins in your project for them to work.
        </p>
        <p class="js-plugins-note js-plugins-experimental-note">
          Note: JS plugin support is experimental and may not work perfectly with all plugins or
          rules, these particular JS plugins have only been tested with basic configurations. Read
          more about JS Plugins in
          <a
            href="https://oxc.rs/docs/guide/usage/linter/js-plugins.html"
            target="_blank"
            rel="noopener noreferrer"
            >the Oxlint documentation</a
          >.
        </p>
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

.js-plugins-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.js-plugins-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--color-text-secondary);
  text-align: left;
}

.js-plugins-toggle:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border-color: var(--color-border-hover);
}

.experimental-badge {
  font-size: 0.6875rem;
  color: var(--color-primary);
  background: var(--color-primary-muted);
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.js-plugins-content {
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

.js-plugin-selection {
  margin-top: 0.5rem;
}

.js-plugin-button {
  border-style: dashed;
}

.js-plugin-button.selected {
  border-style: solid;
}

.js-plugins-note {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.75rem;
  font-style: italic;
}

.js-plugins-experimental-note {
  background: var(--color-code-bg);
  color: var(--color-text-secondary);
  padding: 0.75rem;
  border-radius: 6px;
  font-style: normal;
  border: 1px solid var(--color-border);
}
</style>
