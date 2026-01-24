import type {
  PluginName,
  JSPluginName,
  OxlintConfig,
  OxlintRule,
  RuleOverride,
  JSPluginData,
} from "../types";
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
import playwrightPlugin from "../../data/js-plugins/playwright.json";
import stylisticPlugin from "../../data/js-plugins/stylistic.json";

const pluginDataMap: Record<
  PluginName,
  {
    name: string;
    rules: Record<
      string,
      {
        recommended?: boolean | string | Record<string, unknown>;
        fixable?: boolean;
        deprecated?: boolean;
      }
    >;
  }
> = {
  eslint: { name: "eslint", rules: {} },
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

export const jsPluginDataMap: Record<JSPluginName, JSPluginData> = {
  playwright: playwrightPlugin as JSPluginData,
  stylistic: stylisticPlugin as JSPluginData,
  storybook: {
    name: "storybook",
    packageName: "eslint-plugin-storybook",
    rulePrefix: "storybook",
    rules: {},
  },
  "testing-library": {
    name: "testing-library",
    packageName: "eslint-plugin-testing-library",
    rulePrefix: "testing-library",
    rules: {},
  },
  cypress: {
    name: "cypress",
    packageName: "eslint-plugin-cypress",
    rulePrefix: "cypress",
    rules: {},
  },
};

export const scopeToPluginMap: Record<string, PluginName> = {
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
  node: "node",
};

const isRecommendedValue = (
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

export function isRuleRecommended(rule: OxlintRule): boolean {
  // For eslint and oxc rules, use the default flag
  if (rule.scope === "eslint" || rule.scope === "oxc") {
    return rule.default;
  }

  // For plugin rules, check the plugin data
  const pluginName = scopeToPluginMap[rule.scope];
  if (pluginName) {
    const pluginData = pluginDataMap[pluginName];
    if (pluginData) {
      return isRecommendedValue(pluginData.rules[rule.value]?.recommended);
    }
  }

  return false;
}

export function isRuleDeprecated(rule: OxlintRule): boolean {
  // Check in rule object first (if source included deprecated flag)
  if ((rule as any).deprecated === true) return true;

  // For plugin rules, check plugin metadata
  const pluginName = scopeToPluginMap[rule.scope];
  if (pluginName) {
    const pluginData = pluginDataMap[pluginName];
    if (pluginData) {
      return Boolean(pluginData.rules[rule.value]?.deprecated);
    }
  }

  // No deprecation info found
  return false;
}

export function getRuleId(rule: OxlintRule): string {
  // Always prefix with the scope (hyphenate underscores), e.g. eslint/accessor-pairs
  return `${rule.scope.replace("_", "-")}/${rule.value}`;
}

export function generateOxlintConfig(
  selectedPlugins: PluginName[],
  selectedJSPlugins: JSPluginName[],
  enableTypeAware: boolean,
  useRecommended: boolean,
  ruleOverrides: Record<string, RuleOverride> = {},
  jsPluginRuleOverrides: Record<string, RuleOverride> = {},
): string {
  // Build config with keys in desired order: $schema, jsPlugins, plugins, categories, rules
  // Exclude 'eslint' from the plugins list since ESLint is not an oxlint plugin
  const explicitPlugins = selectedPlugins.filter((p) => p !== "eslint");

  // Build jsPlugins array with package names
  const jsPluginsPackages = selectedJSPlugins.map((name) => jsPluginDataMap[name].packageName);

  const config: OxlintConfig = {
    $schema: "./node_modules/oxlint/configuration_schema.json",
    jsPlugins: jsPluginsPackages.length > 0 ? jsPluginsPackages : undefined,
    plugins: explicitPlugins.length > 0 ? [...explicitPlugins] : undefined,
    categories: {
      correctness: "off",
    },
    rules: {},
  };

  // Filter rules based on selected plugins
  const allRules = rulesData as OxlintRule[];
  const selectedRules = allRules.filter((rule) => {
    // Exclude nursery rules
    if (rule.category === "nursery") {
      return false;
    }

    // Exclude deprecated rules
    if (isRuleDeprecated(rule)) {
      return false;
    }

    const pluginName = scopeToPluginMap[rule.scope];

    // Include eslint core rules only if user selected the 'eslint' plugin
    if (rule.scope === "eslint") {
      return selectedPlugins.includes("eslint");
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

  // Build rules based on recommended + overrides
  for (const rule of selectedRules) {
    const ruleId = getRuleId(rule);
    const override = ruleOverrides[ruleId];

    // If there's an explicit override, use it
    if (override !== undefined && override !== null) {
      if (override !== "off") {
        config.rules![ruleId] = override;
      }
      // If override is "off", we don't add it (rule stays disabled)
      continue;
    }

    // No override - use recommended status if useRecommended is enabled
    if (useRecommended && isRuleRecommended(rule)) {
      config.rules![ruleId] = "error";
    }
  }

  // Add JS plugin rules
  for (const jsPluginName of selectedJSPlugins) {
    const jsPlugin = jsPluginDataMap[jsPluginName];
    for (const [ruleName, ruleData] of Object.entries(jsPlugin.rules)) {
      if (ruleData.deprecated) continue;

      const ruleId = `${jsPlugin.rulePrefix}/${ruleName}`;
      const override = jsPluginRuleOverrides[ruleId];

      if (override !== undefined && override !== null) {
        if (override !== "off") {
          config.rules![ruleId] = override;
        }
        continue;
      }

      // Use recommended if enabled
      if (useRecommended && ruleData.recommended) {
        config.rules![ruleId] = "error";
      }
    }
  }

  return JSON.stringify(config, null, 2);
}

export function countEnabledRules(
  selectedPlugins: PluginName[],
  selectedJSPlugins: JSPluginName[],
  enableTypeAware: boolean,
  useRecommended: boolean,
  ruleOverrides: Record<string, RuleOverride> = {},
  jsPluginRuleOverrides: Record<string, RuleOverride> = {},
): number {
  const allRules = rulesData as OxlintRule[];
  let count = 0;

  for (const rule of allRules) {
    // Exclude nursery rules
    if (rule.category === "nursery") {
      continue;
    }

    const pluginName = scopeToPluginMap[rule.scope];

    // Check if rule is in scope
    if (rule.scope === "eslint") {
      if (!selectedPlugins.includes("eslint")) {
        continue;
      }
    } else {
      if (!pluginName || !selectedPlugins.includes(pluginName)) {
        continue;
      }
      if (!enableTypeAware && rule.type_aware) {
        continue;
      }
    }

    // Skip deprecated rules
    if (isRuleDeprecated(rule)) {
      continue;
    }

    const ruleId = getRuleId(rule);
    const override = ruleOverrides[ruleId];

    if (override !== undefined && override !== null) {
      if (override !== "off") {
        count++;
      }
    } else if (useRecommended && isRuleRecommended(rule)) {
      count++;
    }
  }

  // Count JS plugin rules
  for (const jsPluginName of selectedJSPlugins) {
    const jsPlugin = jsPluginDataMap[jsPluginName];
    for (const [ruleName, ruleData] of Object.entries(jsPlugin.rules)) {
      if (ruleData.deprecated) continue;

      const ruleId = `${jsPlugin.rulePrefix}/${ruleName}`;
      const override = jsPluginRuleOverrides[ruleId];

      if (override !== undefined && override !== null) {
        if (override !== "off") {
          count++;
        }
      } else if (useRecommended && ruleData.recommended) {
        count++;
      }
    }
  }

  return count;
}
