const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const nativeWindConfig = withNativeWind(config, { input: "./src/global.css" });

// Metro outputs a classic script for web (no type="module"), but resolves ESM
// builds when isESMImport=true, adding "import" to the package exports
// condition set. Packages like Zustand ship an ESM build that uses
// import.meta.env, which crashes in a classic script context.
// Force isESMImport=false on web so Metro uses "require"→"default"→CJS instead.
const prevResolveRequest = nativeWindConfig.resolver.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = prevResolveRequest ?? context.resolveRequest;
  if (platform === "web") {
    return resolve({ ...context, isESMImport: false }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = nativeWindConfig;
