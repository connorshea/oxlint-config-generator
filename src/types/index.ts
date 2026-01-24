export interface OxlintRule {
  scope: string;
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

export type JSPluginName = "playwright" | "stylistic";

export interface JSPluginData {
  name: string;
  packageName: string;
  rulePrefix: string;
  rules: Record<string, { recommended: boolean; fixable: boolean; deprecated?: boolean }>;
}
