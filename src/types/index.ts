export interface Rule {
  name: string;
  category: string;
  plugin?: string;
  documentation?: string;
  typescript?: boolean;
  recommended?: boolean;
  fixable?: boolean;
}

export interface PluginRules {
  plugin: string;
  rules: {
    [key: string]: {
      recommended?: boolean;
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
  plugins?: string[];
  categories?: {
    correctness?: string;
  };
  rules?: {
    [key: string]: string;
  };
}

export type PluginName =
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
