#!/usr/bin/env node

import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Get version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: npm run setVersion <version>');
  console.error('Example: npm run setVersion 1.2.3');
  process.exit(1);
}

// Validate version format
const versionRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
if (!versionRegex.test(newVersion)) {
  console.error(`Invalid version format: ${newVersion}`);
  console.error('Expected format: x.y.z or x.y.z-prerelease');
  process.exit(1);
}

// Main execution
console.log(`Setting version to ${newVersion} in all packages...\n`);

try {
  // Update root package.json
  execSync(`npm version ${newVersion} --no-git-tag-version`, { cwd: rootDir, stdio: 'inherit' });

  // Update all workspace packages
  execSync(`npm version ${newVersion} --workspaces --no-git-tag-version`, { cwd: rootDir, stdio: 'inherit' });

  console.log('\nVersion update complete!');
} catch (error) {
  console.error(`Failed to update version: ${error.message}`);
  process.exit(1);
}
