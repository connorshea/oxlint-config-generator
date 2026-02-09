import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface JSPluginConfig {
  name: string;
  packageName: string;
  rulePrefix: string;
}

const jsPlugins: JSPluginConfig[] = [
  { name: "playwright", packageName: "eslint-plugin-playwright", rulePrefix: "playwright" },
  { name: "stylistic", packageName: "@stylistic/eslint-plugin", rulePrefix: "@stylistic" },
  { name: "storybook", packageName: "eslint-plugin-storybook", rulePrefix: "storybook" },
  {
    name: "testing-library",
    packageName: "eslint-plugin-testing-library",
    rulePrefix: "testing-library",
  },
  { name: "cypress", packageName: "eslint-plugin-cypress", rulePrefix: "cypress" },
  { name: "e18e", packageName: "@e18e/eslint-plugin", rulePrefix: "e18e" },
];

async function generateJSPluginData() {
  console.log("Generating JS Plugin data...");

  const dataDir = join(__dirname, "..", "data", "js-plugins");
  mkdirSync(dataDir, { recursive: true });

  for (const plugin of jsPlugins) {
    try {
      console.log(`Processing ${plugin.name}...`);

      // Dynamic import of the plugin
      const pluginModule = await import(plugin.packageName);
      const pluginExport = pluginModule.default || pluginModule;

      const pluginData: {
        name: string;
        packageName: string;
        rulePrefix: string;
        rules: Record<string, { recommended: boolean; fixable: boolean; deprecated?: boolean }>;
      } = {
        name: plugin.name,
        packageName: plugin.packageName,
        rulePrefix: plugin.rulePrefix,
        rules: {},
      };

      // Get plugin rules
      const rules = pluginExport.rules || {};

      // Try to get recommended config
      const configs = pluginExport.configs || {};
      let recommendedRules: Record<string, unknown> = {};

      // Helper to merge rule sets from a config value
      const mergeRulesFromConfigValue = (cfg: any) => {
        if (!cfg) return;
        if (cfg.rules && typeof cfg.rules === "object") {
          recommendedRules = { ...recommendedRules, ...cfg.rules };
        } else if (Array.isArray(cfg)) {
          for (const item of cfg) {
            if (item?.rules) recommendedRules = { ...recommendedRules, ...item.rules };
          }
        } else if (typeof cfg === "object") {
          recommendedRules = { ...recommendedRules, ...(cfg.rules || cfg) };
        }
      };

      // Check various common config names
      mergeRulesFromConfigValue(configs.recommended);
      mergeRulesFromConfigValue(configs["flat/recommended"]);
      mergeRulesFromConfigValue(configs["playwright-test"]);

      // Normalize rule names
      const normalizedRecommendedRules = new Set<string>();
      for (const ruleName of Object.keys(recommendedRules)) {
        const shortName = ruleName.includes("/") ? ruleName.split("/").pop()! : ruleName;
        normalizedRecommendedRules.add(shortName);
        normalizedRecommendedRules.add(ruleName);
      }

      // Process each rule
      for (const [ruleName, ruleConfig] of Object.entries(rules)) {
        const rule = ruleConfig as {
          meta?: {
            docs?: { recommended?: boolean; deprecated?: boolean };
            deprecated?: boolean;
            fixable?: string | boolean;
          };
        };

        const isRecommendedViaMeta = rule.meta?.docs?.recommended === true;
        const isRecommendedViaConfig =
          normalizedRecommendedRules.has(ruleName) ||
          normalizedRecommendedRules.has(`${plugin.rulePrefix}/${ruleName}`);

        let isDeprecated = false;
        if (rule.meta?.deprecated !== undefined) {
          isDeprecated = typeof rule.meta.deprecated === "boolean" ? rule.meta.deprecated : true;
        }
        if (!isDeprecated && rule.meta?.docs?.deprecated !== undefined) {
          isDeprecated = Boolean(rule.meta.docs.deprecated);
        }

        pluginData.rules[ruleName] = {
          recommended: isRecommendedViaMeta || isRecommendedViaConfig,
          fixable: Boolean(rule.meta?.fixable),
          deprecated: isDeprecated,
        };
      }

      // Write to file
      const outputPath = join(dataDir, `${plugin.name}.json`);
      writeFileSync(outputPath, JSON.stringify(pluginData, null, 2));

      const recommendedCount = Object.values(pluginData.rules).filter((r) => r.recommended).length;
      const deprecatedCount = Object.values(pluginData.rules).filter((r) => r.deprecated).length;
      console.log(
        `  ✓ ${plugin.name}: ${Object.keys(pluginData.rules).length} rules (${recommendedCount} recommended, ${deprecatedCount} deprecated)`,
      );
    } catch (error) {
      console.error(`  ✗ Error processing ${plugin.name}:`, error);
    }
  }

  console.log("\n✓ JS Plugin data generation complete!");
}

generateJSPluginData();
