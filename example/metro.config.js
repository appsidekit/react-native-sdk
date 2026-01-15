const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const sdkRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// Helper to escape special regex characters in paths
const escapeRegex = (str) => str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');

// Watch SDK source files during development
config.watchFolders = [sdkRoot];

// Prevent issues with duplicate React/React Native by blocking only those from SDK's node_modules
config.resolver.blockList = [
  new RegExp(`${escapeRegex(path.join(sdkRoot, 'node_modules', 'react-native'))}/.*`),
  new RegExp(`${escapeRegex(path.join(sdkRoot, 'node_modules', 'react'))}/.*`),
];

// Set node modules paths to prioritize example app's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(sdkRoot, 'node_modules'),
];

module.exports = config;
