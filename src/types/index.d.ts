export interface OxlintRule {
  scope: ScopeName;
  value: string;
  category: string;
  type_aware: boolean;
  fix: string;
  default: boolean;
  docs_url: string;
}

export type RuleOverride = "error" | "warn" | "off" | null;

export interface PluginRules {
  plugin: string;
  rules: {
    [key: string]: {
      recommended?: boolean | string | Record<string, unknown>;
      fixable?: boolean;
      meta?: {
        docs?: {
          recommended?: boolean;
          url?: string;
        };
        type?: string;
      };
    };
  };
}

export interface OxlintConfig {
  $schema: string;
  jsPlugins?: string[];
  plugins?: string[];
  categories?: {
    correctness?: string;
  };
  rules?: {
    [key: string]: string;
  };
}

export type PluginName =
  | "eslint"
  | "oxc"
  | "react"
  | "react-perf"
  | "jsx-a11y"
  | "import"
  | "jsdoc"
  | "jest"
  | "vitest"
  | "unicorn"
  | "typescript"
  | "vue"
  | "next"
  | "promise"
  | "node";

// Names of native plugins (with underscores).
export type ScopeName =
  | "eslint"
  | "oxc"
  | "react"
  | "react_perf"
  | "jsx_a11y"
  | "import"
  | "jsdoc"
  | "jest"
  | "vitest"
  | "unicorn"
  | "typescript"
  | "vue"
  | "nextjs"
  | "promise"
  | "node";

export type JSPluginName =
  | "playwright"
  | "stylistic"
  | "storybook"
  | "testing-library"
  | "cypress"
  | "e18e";

// This is for JS Plugins.
// Should be the same as PluginName but with @ prefixes on scoped packages (except for some edge cases yay).
export type RulePrefix =
  | "playwright"
  | "@stylistic"
  | "storybook"
  | "testing-library"
  | "cypress"
  | "e18e";

export interface JSPluginData {
  name: JSPluginName;
  packageName: string;
  rulePrefix: RulePrefix;
  rules: Record<string, { recommended: boolean; fixable: boolean; deprecated?: boolean }>;
}
