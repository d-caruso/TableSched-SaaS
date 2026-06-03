const path = require("path");
const fs = require("fs");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const coreRoot = path.resolve(__dirname, "../../TableSched/frontend");

config.watchFolders = [coreRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(coreRoot, "node_modules"),
];

// Custom resolver: enable shadowing of core components
// When @core/... or tablesched-frontend/... imports are encountered,
// check for local SaaS override first; if not found, use installed package
// Packages that must resolve to the core's installation so both the SaaS
// bundle and core bundle share a single React dispatcher. Covers exact names
// AND sub-paths (e.g. react-dom/server) because react-dom-server sets up
// ReactCurrentDispatcher — if that's a different react-dom copy from the one
// components use, hooks see a null dispatcher.
//
// tamagui / @tamagui are pinned for the same reason: core ships its own
// nested tamagui copy, so without this SaaS bundles a second physical copy.
// createTamagui() in tamagui.config.ts only configures the copy it imports,
// leaving core components rendering an unconfigured instance ("Can't find
// Tamagui configuration"). Pinning to core's copy yields one configured
// singleton shared by both SaaS and core components.
const PINNED_PREFIXES = [
  "react",
  "react-dom",
  "react-native",
  "tamagui",
  "@tamagui",
];

function isPinned(moduleName) {
  return PINNED_PREFIXES.some(
    (prefix) => moduleName === prefix || moduleName.startsWith(prefix + "/"),
  );
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Deduplicate React family: always use the core's copy.
  if (isPinned(moduleName)) {
    try {
      const filePath = require.resolve(moduleName, { paths: [coreRoot] });
      return { filePath, type: "sourceFile" };
    } catch {
      // Sub-path not present in core — fall through to default resolution.
    }
  }

  let relativeImport = null;

  if (moduleName.startsWith("tablesched-frontend/")) {
    relativeImport = moduleName.replace("tablesched-frontend/", "./");
  } else if (moduleName.startsWith("@core/")) {
    relativeImport = moduleName.replace("@core/", "./");
  }

  if (relativeImport) {
    const localPath = path.resolve(__dirname, relativeImport);
    const extensions = [".tsx", ".ts", ".jsx", ".js"];

    for (const ext of extensions) {
      const filePath = localPath + ext;
      // Skip if the resolved file is the same as the requesting file (circular)
      if (fs.existsSync(filePath) && filePath !== context.originModulePath) {
        return { filePath, type: "sourceFile" };
      }
    }

    for (const ext of extensions) {
      const filePath = path.join(localPath, `index${ext}`);
      if (fs.existsSync(filePath) && filePath !== context.originModulePath) {
        return { filePath, type: "sourceFile" };
      }
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
