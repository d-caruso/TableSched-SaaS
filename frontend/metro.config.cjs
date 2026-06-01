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
// bundle and core bundle share a single instance (required for React hooks).
const PINNED_TO_CORE = new Set(["react", "react-dom", "react-native"]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Deduplicate React family: always use the core's copy.
  if (PINNED_TO_CORE.has(moduleName)) {
    const filePath = require.resolve(moduleName, { paths: [coreRoot] });
return { filePath, type: "sourceFile" };
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
