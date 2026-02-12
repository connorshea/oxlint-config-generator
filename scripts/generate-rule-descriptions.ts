import { execSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_URL = "https://github.com/oxc-project/website.git";
const DEFAULT_CLONE_DIR = join(__dirname, "..", "vendor", "oxc-project-site");
const RULES_GLOB_DIR = join("src", "docs", "guide", "usage", "linter", "rules");
const OUTPUT_DIR = join(__dirname, "..", "data");
const OUTPUT_FILE = join(OUTPUT_DIR, "rule-descriptions.json");

function log(...args: unknown[]) {
  console.log("[generate-rule-descriptions]", ...args);
}

function ensureDir(p: string) {
  mkdirSync(p, { recursive: true });
}

function cloneOrUpdateRepo(cloneDir: string) {
  if (statSyncSafe(cloneDir)) {
    log(`Found existing repo at ${cloneDir}, attempting to update (git pull)...`);
    try {
      execSync("git pull", { cwd: cloneDir, stdio: "inherit" });
    } catch (e) {
      log("Failed to update existing repo; you may need to update it manually.");
    }
  } else {
    log(`Cloning ${REPO_URL} into ${cloneDir}...`);
    ensureDir(dirname(cloneDir));
    execSync(`git clone --depth 1 ${REPO_URL} "${cloneDir}"`, { stdio: "inherit" });
  }
}

function statSyncSafe(path: string) {
  try {
    return statSync(path);
  } catch (e) {
    return null;
  }
}

function walkDir(dir: string, callback: (filePath: string) => void) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, callback);
    } else {
      callback(full);
    }
  }
}

function extractWhatItDoes(markdown: string) {
  // Remove windows CRs
  const md = markdown.replace(/\r/g, "");

  // Match `<RuleHeader />` and strip everything before it.
  const ruleHeaderIndex = md.indexOf("<RuleHeader />");
  const mdAfterHeader = ruleHeaderIndex !== -1 ? md.slice(ruleHeaderIndex) : md;

  // Match a heading like '### What it does' (exactly level 3)
  const headingRegex = /^#{3}\s*What it does\s*$/gim;
  const match = headingRegex.exec(mdAfterHeader);
  if (!match) return "";

  // Find the start index after the heading
  const startIndex = match.index + match[0].length;

  // Slice from after heading to the next heading or end of file
  const rest = mdAfterHeader.slice(startIndex);
  const nextHeadingMatch = rest.match(/^#{3}\s*.*$/m);
  const endIndex = nextHeadingMatch ? nextHeadingMatch.index : rest.length;
  let section = rest.slice(0, endIndex).trim();

  // Remove codeblocks
  section = section.replace(/```[\s\S]*?```/g, "");

  // Convert links [text](url) -> text
  section = section.replace(/!\[[^\]]*\]\([^)]*\)/g, ""); // remove images
  section = section.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Do not strip inline code
  // section = section.replace(/`([^`]+)`/g, "$1");

  // Remove remaining Markdown emphasis and headings
  section = section.replace(/(^|\n)#{1,3}\s.*$/gim, "");
  section = section.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");
  section = section.replace(/_{1,2}([^_]+)_{1,2}/g, "$1");

  // Normalize whitespace
  section = section.replace(/\n{2,}/g, "\n\n").trim();

  return section;
}

function buildDescriptionsFromRepo(baseDir: string) {
  const targetDir = join(baseDir, RULES_GLOB_DIR);
  const stats = statSyncSafe(targetDir);
  if (!stats) {
    throw new Error(`Rules directory not found in repo at ${targetDir}`);
  }

  const descriptions: Record<string, Record<string, string>> = {};

  walkDir(targetDir, (filePath) => {
    if (!filePath.endsWith(".md")) return;
    // path after rules dir: <plugin>/<rule>.md
    const rel = relative(targetDir, filePath);
    const parts = rel.split(/\/|\\/);
    if (parts.length !== 2) return; // skip unexpected layout
    const [plugin, fileName] = parts;
    const ruleName = fileName.replace(/\.md$/, "");

    const content = readFileSync(filePath, "utf8");
    const desc = extractWhatItDoes(content);

    if (!descriptions[plugin]) descriptions[plugin] = {};
    descriptions[plugin][ruleName] = desc;
  });

  return descriptions;
}

function sortObjectKeys<T>(obj: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

function saveDescriptions(obj: Record<string, Record<string, string>>) {
  ensureDir(OUTPUT_DIR);
  // Sort plugins and rules within each plugin alphabetically
  const sorted = sortObjectKeys(obj);
  for (const key of Object.keys(sorted)) {
    sorted[key] = sortObjectKeys(sorted[key]);
  }
  writeFileSync(OUTPUT_FILE, JSON.stringify(sorted, null, 2));
  log(`Saved descriptions to ${OUTPUT_FILE}`);
}

// CLI
(async function main() {
  try {
    const args = process.argv.slice(2);
    const cloneDirArg = args.find((a) => a.startsWith("--clone-dir="));
    const skipClone = args.includes("--skip-clone");
    const addSubmodule = args.includes("--add-submodule");

    const cloneDir = cloneDirArg ? cloneDirArg.split("=")[1] : DEFAULT_CLONE_DIR;

    if (addSubmodule) {
      log("Adding git submodule at oxc-project-site");
      execSync(`git submodule add ${REPO_URL} oxc-project-site`, { stdio: "inherit" });
      log("Submodule added. Run 'git submodule update --init --recursive' if needed.");
      return;
    }

    if (!skipClone) {
      cloneOrUpdateRepo(cloneDir);
    } else {
      log("--skip-clone provided; using existing repo at %s", cloneDir);
    }

    const descriptions = buildDescriptionsFromRepo(cloneDir);
    saveDescriptions(descriptions);

    log("Done. Total plugins:", Object.keys(descriptions).length);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
