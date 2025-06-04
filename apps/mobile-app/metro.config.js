const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Reset watchFolders to avoid conflicts
config.watchFolders = [monorepoRoot];

// Fix resolver to properly handle monorepo
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ],
  // Disable hierarchical lookup
  disableHierarchicalLookup: true,
  // Add platforms
  platforms: ['ios', 'android', 'native', 'web'],
};

// Make sure Metro knows about the backend package
config.watchFolders.push(
  path.resolve(monorepoRoot, 'packages/backend')
);

module.exports = config;