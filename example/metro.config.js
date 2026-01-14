const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const sdkRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// Watch SDK source files during development
config.watchFolders = [sdkRoot];

// Prevent issues with duplicate modules
config.resolver.blockList = [
  new RegExp(`${path.escape(path.join(sdkRoot, 'node_modules', 'react-native'))}/.*`),
  new RegExp(`${path.escape(path.join(sdkRoot, 'node_modules', 'react'))}/.*`),
];

// Resolve SDK from parent directory
config.resolver.extraNodeModules = {
  '@sidekit/react-native': sdkRoot,
};

module.exports = config;
