import path from "path";
import fs from "fs";
import { getDefaultConfig } from "expo/metro-config.js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = getDefaultConfig(__dirname);
const coreRoot = path.resolve(__dirname, "../../TableSched/frontend");

config.watchFolders = [coreRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(coreRoot, "node_modules"),
];

// Custom resolver: enable shadowing of core components
// Supports both direct imports (tablesched-frontend/...) and aliased imports (@core/...)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  let relativeImport = null;

  // Handle direct imports: "tablesched-frontend/components/X"
  if (moduleName.startsWith("tablesched-frontend/")) {
    relativeImport = moduleName.replace("tablesched-frontend/", "./");
  }
  // Handle aliased imports: "@core/components/X"
  else if (moduleName.startsWith("@core/")) {
    relativeImport = moduleName.replace("@core/", "./");
  }

  // If this is a core import, check for local override
  if (relativeImport) {
    const localPath = path.resolve(__dirname, relativeImport);
    const extensions = [".tsx", ".ts", ".jsx", ".js"];

    // Check for file with extension
    for (const ext of extensions) {
      const filePath = localPath + ext;
      if (fs.existsSync(filePath)) {
        return { filePath, type: "sourceFile" };
      }
    }

    // Check for index file
    for (const ext of extensions) {
      const filePath = path.join(localPath, `index${ext}`);
      if (fs.existsSync(filePath)) {
        return { filePath, type: "sourceFile" };
      }
    }

    // No local override found; let standard resolver handle it
    // (for @core/, this will apply the tsconfig alias)
  }

  // Default: use standard Metro resolver
  return context.resolveRequest(context, moduleName, platform);
};

export default config;
