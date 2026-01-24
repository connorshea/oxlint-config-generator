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

const pluginDataMap: Record<
  PluginName,
  {
    name: string;
    rules: Record<string, { recommended: boolean | string | Record<string, unknown> }>;
  }
> = {
  oxc: { name: "oxc", rules: {} },
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
  oxc: "oxc",
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

const isRecommended = (
  recommended: boolean | string | Record<string, unknown> | undefined,
): boolean => {
  if (typeof recommended === "boolean") {
    return recommended;
  }
  if (typeof recommended === "string") {
    return recommended === "recommended" || recommended === "error";
  }
  if (typeof recommended === "object" && recommended !== null) {
    return Boolean(recommended.recommended);
  }
  return false;
};

export function generateOxlintConfig(
  selectedPlugins: PluginName[],
  enableTypeAware: boolean,
  useRecommended: boolean,
): string {
  const config: OxlintConfig = {
    $schema: "./node_modules/oxlint/configuration_schema.json",
    categories: {
      correctness: "off",
    },
    rules: {},
  };

  // Add selected plugins
  if (selectedPlugins.length > 0) {
    config.plugins = [...selectedPlugins];
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
    const pluginName = scopeToPluginMap[rule.scope];

    // Include eslint core rules always
    if (rule.scope === "eslint") {
      return true;
    }

    // Include rules from selected plugins (including oxc)
    if (pluginName && selectedPlugins.includes(pluginName)) {
      // Filter out type-aware rules if not enabled
      if (!enableTypeAware && rule.type_aware) {
        return false;
      }
      return true;
    }

    return false;
  });

  // If useRecommended is enabled, only enable recommended rules
  if (useRecommended) {
    for (const rule of selectedRules) {
      const pluginName = scopeToPluginMap[rule.scope];

      // For core eslint rules, use default flag
      if (rule.scope === "eslint") {
        if (rule.default) {
          config.rules![rule.value] = "error";
        }
        continue;
      }

      // For oxc rules, use default flag (no external eslint plugin data)
      if (rule.scope === "oxc") {
        if (rule.default) {
          config.rules![`oxc/${rule.value}`] = "error";
        }
        continue;
      }

      // For plugin rules, check if recommended in the plugin data
      if (pluginName) {
        const pluginData = pluginDataMap[pluginName];
        if (pluginData && isRecommended(pluginData.rules[rule.value]?.recommended)) {
          const ruleName = `${rule.scope.replace("_", "-")}/${rule.value}`;
          config.rules![ruleName] = "error";
        }
      }
    }
  }

  return JSON.stringify(config, null, 2);
}
