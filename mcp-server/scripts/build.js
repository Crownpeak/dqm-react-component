#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, 'data');

// Load config
const configPath = path.resolve(rootDir, 'docs-mcp.config.json');
let config = {
	includeDir: null,
	ignorePatterns: [
		'node_modules',
		'.git',
		'dist',
		'build',
		'coverage',
		'*.log',
		'*.lock',
		'*.tgz',
		'dump.rdb'
	],
	enableBuildCleanup: true
};

if (fs.existsSync(configPath)) {
	try {
		const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		config = { ...config, ...fileConfig };
		console.log(`Loaded configuration from ${configPath}`);
	} catch (error) {
		console.error(`Error loading configuration from ${configPath}:`, error);
	}
}

/**
 * Copy included directory to the data directory.
 */
async function copyIncludedDir() {
	const includeDir = path.resolve(rootDir, config.includeDir);
	console.log(`Copying ${includeDir} to ${dataDir}...`);

	// Build ignore patterns - ensure mcp-server is always excluded
	const ignorePatterns = [
		...config.ignorePatterns,
		'mcp-server/**',
		'**/mcp-server/**'
	];

	try {
		// Get all files in the directory, respecting .gitignore
		const files = await glob('**/*', {
			cwd: includeDir,
			nodir: true,
			ignore: ignorePatterns,
			dot: true,
			gitignore: true
		});

		console.log(`Found ${files.length} files in ${includeDir} (respecting .gitignore)`);

		// Copy each file
		for (const file of files) {
			const sourcePath = path.join(includeDir, file);
			const targetPath = path.join(dataDir, file);

			// Ensure the target directory exists
			await fs.ensureDir(path.dirname(targetPath));

			// Copy the file
			await fs.copy(sourcePath, targetPath);
		}

		console.log(`Successfully copied ${files.length} files to ${dataDir}`);
	} catch (error) {
		console.error('Error copying included directory:', error);
		throw error;
	}
}

/**
 * Clean up the data directory by removing large/binary files.
 */
async function cleanupDataDir() {
	console.log('Cleaning up data directory...');

	const binaryPatterns = [
		'**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.ico', '**/*.svg',
		'**/*.mp4', '**/*.webm', '**/*.mov', '**/*.avi',
		'**/*.zip', '**/*.tar', '**/*.gz', '**/*.rar',
		'**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot',
		'**/*.pdf', '**/*.doc', '**/*.docx',
		'**/node_modules/**',
		'**/.git/**',
		'**/dist/**',
		'**/build/**',
		'**/coverage/**'
	];

	let removedCount = 0;
	const maxFileSize = 100 * 1024; // 100KB

	// Remove files matching binary patterns
	for (const pattern of binaryPatterns) {
		const files = await glob(pattern, { cwd: dataDir, nodir: true, dot: true });
		for (const file of files) {
			const filePath = path.join(dataDir, file);
			try {
				await fs.remove(filePath);
				removedCount++;
			} catch (error) {
				console.error(`Error removing ${filePath}:`, error);
			}
		}
	}

	// Remove files larger than maxFileSize
	const allFiles = await glob('**/*', { cwd: dataDir, nodir: true, dot: true });
	for (const file of allFiles) {
		const filePath = path.join(dataDir, file);
		try {
			const stats = await fs.stat(filePath);
			if (stats.size > maxFileSize) {
				await fs.remove(filePath);
				removedCount++;
			}
		} catch (error) {
			// File might have been removed already
		}
	}

	console.log(`Cleanup complete. Removed ${removedCount} files.`);
}

/**
 * Main build function
 */
async function build() {
	console.log('Building DQM Docs MCP package...');

	try {
		// Create data directory if it doesn't exist
		await fs.ensureDir(dataDir);

		// Clear the data directory first
		await fs.emptyDir(dataDir);

		if (config.includeDir) {
			await copyIncludedDir();
		} else {
			console.log('No includeDir specified. Created empty data directory.');
		}

		// Perform cleanup if enabled
		if (config.enableBuildCleanup) {
			await cleanupDataDir();
		} else {
			console.log('Build cleanup is disabled via configuration.');
		}

		// Make the bin script executable
		const binPath = path.join(rootDir, 'bin', 'mcp');
		if (fs.existsSync(binPath)) {
			await fs.chmod(binPath, 0o755);
			console.log(`Made bin script executable: ${binPath}`);
		}

		// Count final files
		const finalFiles = await glob('**/*', { cwd: dataDir, nodir: true, dot: true });
		console.log(`\n✅ Build process finished successfully!`);
		console.log(`   Files in data directory: ${finalFiles.length}`);
		console.log(`   Output: ${dataDir}`);
	} catch (error) {
		console.error('Build failed:', error);
		process.exit(1);
	}
}

build();
