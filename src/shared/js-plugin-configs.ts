import type { JSPluginName, RulePrefix } from "../types";

export interface JSPluginConfig {
  name: JSPluginName;
  packageName: string;
  rulePrefix: RulePrefix;
  label: string;
}

// Single source of truth for all JS plugin configurations.
// When adding a new JS plugin, add it here and update JSPluginName/RulePrefix in src/types/index.ts.
// NOTE: rulePrefix should always be `@npmscope` if the package is `@npmscope/eslint-plugin`,
// unless the package specifies a name in the ESLint plugin meta data.
export const jsPluginConfigs: JSPluginConfig[] = [
  {
    name: "playwright",
    packageName: "eslint-plugin-playwright",
    rulePrefix: "playwright",
    label: "Playwright",
  },
  {
    name: "stylistic",
    packageName: "@stylistic/eslint-plugin",
    rulePrefix: "@stylistic",
    label: "Stylistic",
  },
  {
    name: "storybook",
    packageName: "eslint-plugin-storybook",
    rulePrefix: "storybook",
    label: "Storybook",
  },
  {
    name: "testing-library",
    packageName: "eslint-plugin-testing-library",
    rulePrefix: "testing-library",
    label: "Testing Library",
  },
  {
    name: "cypress",
    packageName: "eslint-plugin-cypress",
    rulePrefix: "cypress",
    label: "Cypress",
  },
  { name: "e18e", packageName: "@e18e/eslint-plugin", rulePrefix: "e18e", label: "e18e" },
];
