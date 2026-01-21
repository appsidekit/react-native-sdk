const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const sdkRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// Helper to escape special regex characters in paths
const escapeRegex = (str) => str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');

// Watch SDK source files during development
config.watchFolders = [sdkRoot];

// Prevent issues with duplicate modules by blocking peer dependencies from SDK's node_modules
config.resolver.blockList = [
  new RegExp(`${escapeRegex(path.join(sdkRoot, 'node_modules', 'react-native'))}/.*`),
  new RegExp(`${escapeRegex(path.join(sdkRoot, 'node_modules', 'react'))}/.*`),
  new RegExp(`${escapeRegex(path.join(sdkRoot, 'node_modules', 'expo'))}/.*`),
  new RegExp(`${escapeRegex(path.join(sdkRoot, 'node_modules', 'expo-linear-gradient'))}/.*`),
  new RegExp(`${escapeRegex(path.join(sdkRoot, 'node_modules', 'expo-application'))}/.*`),
];

// Set node modules paths to prioritize example app's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(sdkRoot, 'node_modules'),
];

// Configure SVG transformer
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
