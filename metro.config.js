const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "wasm"
);

config.resolver.sourceExts.push("wasm");


/* GGWAVE_ANDROID_NODE_BUILTIN_SHIM */
const path = require("path");

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = (context.originModulePath || "").replace(/\\/g, "/");

  const isGgwave = origin.endsWith("/node_modules/ggwave/ggwave.js");

  if (
    platform === "android" &&
    isGgwave &&
    (moduleName === "path" || moduleName === "fs")
  ) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "shims", moduleName + ".js"),
    };
  }

  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;