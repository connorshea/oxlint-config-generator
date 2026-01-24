<script setup lang="ts">
import { ref } from "vue";
import type { PluginName, OxlintConfig } from "../types";
import rulesData from "../../data/rules.json";
import reactPlugin from "../../data/plugins/react.json";
import reactPerfPlugin from "../../data/plugins/react-perf.json";
import jsxA11yPlugin from "../../data/plugins/jsx-a11y.json";
import vuePlugin from "../../data/plugins/vue.json";
import typescriptPlugin from "../../data/plugins/typescript.json";
import importPlugin from "../../data/plugins/import.json";
import jsdocPlugin from "../../data/plugins/jsdoc.json";
import jestPlugin from "../../data/plugins/jest.json";
import vitestPlugin from "../../data/plugins/vitest.json";
import unicornPlugin from "../../data/plugins/unicorn.json";
import nextPlugin from "../../data/plugins/next.json";
import promisePlugin from "../../data/plugins/promise.json";
import nodePlugin from "../../data/plugins/node.json";

const props = defineProps<{
  selectedPlugins: PluginName[];
  enableTypeAware: boolean;
  useRecommended: boolean;
}>();

const emit = defineEmits<{
  generate: [config: string];
}>();

const pluginDataMap: Record<
  PluginName,
  { name: string; rules: Record<string, { recommended: boolean }> }
> = {
  react: reactPlugin,
  "react-perf": reactPerfPlugin,
  "jsx-a11y": jsxA11yPlugin,
  vue: vuePlugin,
  typescript: typescriptPlugin,
  import: importPlugin,
  jsdoc: jsdocPlugin,
  jest: jestPlugin,
  vitest: vitestPlugin,
  unicorn: unicornPlugin,
  next: nextPlugin,
  promise: promisePlugin,
  node: nodePlugin,
};

const scopeToPluginMap: Record<string, PluginName> = {
  react: "react",
  react_perf: "react-perf",
  jsx_a11y: "jsx-a11y",
  vue: "vue",
  typescript: "typescript",
  import: "import",
  jsdoc: "jsdoc",
  jest: "jest",
  vitest: "vitest",
  unicorn: "unicorn",
  nextjs: "next",
  promise: "promise",
  n: "node",
};

const generateConfig = () => {
  const config: OxlintConfig = {
    $schema: "./node_modules/oxlint/configuration_schema.json",
    categories: {
      correctness: "off",
    },
    rules: {},
  };

  // Add selected plugins
  if (props.selectedPlugins.length > 0) {
    config.plugins = [...props.selectedPlugins];
  }

  // Filter rules based on selected plugins
  const selectedRules = (
    rulesData as Array<{
      scope: string;
      value: string;
      type_aware: boolean;
      default: boolean;
    }>
  ).filter((rule) => {
    // Map scope to plugin name
    const pluginName = scopeToPluginMap[rule.scope];

    // Include eslint core rules and oxc rules always
    if (rule.scope === "eslint" || rule.scope === "oxc") {
      return true;
    }

    // Include rules from selected plugins
    if (pluginName && props.selectedPlugins.includes(pluginName)) {
      // Filter out type-aware rules if not enabled
      if (!props.enableTypeAware && rule.type_aware) {
        return false;
      }
      return true;
    }

    return false;
  });

  // If useRecommended is enabled, only enable recommended rules
  if (props.useRecommended) {
    for (const rule of selectedRules) {
      const pluginName = scopeToPluginMap[rule.scope];

      // For core eslint and oxc rules, use default flag
      if (rule.scope === "eslint" || rule.scope === "oxc") {
        if (rule.default) {
          const ruleName =
            rule.scope === "oxc" ? `oxc/${rule.value}` : rule.value;
          config.rules![ruleName] = "error";
        }
        continue;
      }

      // For plugin rules, check if recommended in the plugin data
      if (pluginName) {
        const pluginData = pluginDataMap[pluginName];
        if (pluginData && pluginData.rules[rule.value]?.recommended) {
          const ruleName = `${rule.scope.replace("_", "-")}/${rule.value}`;
          config.rules![ruleName] = "error";
        }
      }
    }
  }

  const configString = JSON.stringify(config, null, 2);
  emit("generate", configString);
};
</script>

<template>
  <div class="section">
    <button class="generate-button" @click="generateConfig">
      Generate Config
    </button>
  </div>
</template>

<style scoped>
.generate-button {
  background-color: #646cff;
  color: white;
  padding: 1em 2em;
  font-size: 1.1em;
  font-weight: 600;
  border: none;
  width: 100%;
}

.generate-button:hover {
  background-color: #535bf2;
}
</style>
