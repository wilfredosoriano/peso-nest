const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Supabase's ESM build uses dynamic import(variable) which Hermes can't
  // handle in release builds. Force the CJS build instead.
  if (moduleName === '@supabase/supabase-js') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/@supabase/supabase-js/dist/index.cjs'
      ),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
