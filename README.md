# Oxlint Config Generator

[View the site here](https://connorshea.github.io/oxlint-config-generator/)

![Oxlint Config Generator Screenshot](./screenshot.png)

A Vue 3 + Vite static website that makes it easy to create Oxlint configuration files.

[Oxlint](https://oxc.rs) is a fast, ESLint-compatible linter for JavaScript and TypeScript written in Rust. It has a lot of rules from various ESLint plugins, and I wanted to create a simple application to set up a configuration file based on the recommended rules from the original plugins.

## Development

### Prerequisites

- Node.js (v24 or higher)
- pnpm

### Setup

```sh
# Install dependencies
pnpm install

# Generate data files (rules and plugin information)
pnpm generate:all
```

### Available Commands

```sh
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint the codebase
pnpm lint

# Format the codebase
pnpm fmt

# Check formatting
pnpm fmt:check

# Generate rules data from oxc-project repository
pnpm generate:rules

# Generate plugin data from ESLint plugins
pnpm generate:plugins

# Generate all data files
pnpm generate:all
```

## Project Structure

```
oxlint-config-generator/
├── data/                     # Generated data files
│   ├── rules.json           # Rules from oxc-project
│   └── plugins/             # Plugin data from ESLint plugins
├── scripts/                  # Data generation scripts
│   ├── generate-rules.ts    # Fetch rules.json
│   └── generate-plugins.ts  # Extract plugin metadata
├── src/
│   ├── components/          # Vue components
│   │   ├── PluginSelector.vue
│   │   ├── ConfigGenerator.vue
│   │   └── ConfigDisplay.vue
│   ├── types/               # TypeScript type definitions
│   ├── App.vue              # Main app component
│   ├── main.ts              # App entry point
│   └── style.css            # Global styles
├── public/                   # Static assets
└── dist/                     # Production build output
```

## How It Works

1. **Data Generation**: Scripts fetch rules data from the oxc-project repository and extract metadata from ESLint plugins
2. **Plugin Selection**: Users select which plugins they want to include
3. **Rule Filtering**: Rules are filtered based on selected plugins and options (type-aware, recommended)
4. **Config Generation**: A `.oxlintrc.json` file is generated with appropriate rules enabled
5. **Export**: Users can copy the configuration to use in their projects

## Tools Used

- **Vue 3** with Composition API
- **Vite** for fast development and building
- **TypeScript** for type safety
- **oxlint** for linting
- **oxfmt** for code formatting
- **pnpm** as package manager

## License

MIT
