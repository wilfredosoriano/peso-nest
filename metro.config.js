const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Supabase pulls in @opentelemetry which uses dynamic import() — Hermes can't
// handle it in release builds. Redirect the whole package to an empty shim.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@opentelemetry/')) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/shims/opentelemetry.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
