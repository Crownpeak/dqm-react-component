#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { search } from '@probelabs/probe';
import simpleGit from 'simple-git';
import axios from 'axios';
import * as tar from 'tar';
import { loadConfig } from './config.js';
import minimist from 'minimist';

// Get the package.json to determine the version
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

// Get version from package.json
let packageVersion = '1.0.0';
try {
	if (fs.existsSync(packageJsonPath)) {
		console.error(`Found package.json at: ${packageJsonPath}`);
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
		if (packageJson.version) {
			packageVersion = packageJson.version;
			console.error(`Using version from package.json: ${packageVersion}`);
		}
	}
} catch (error) {
	console.error(`Error reading package.json:`, error);
}

// Load configuration (handles defaults, file, env, args precedence)
const config = loadConfig();

// Git instance - initialize lazily only if needed for auto-updates
let git = null;

// Ensure the data directory exists (might be empty initially)
try {
	fs.ensureDirSync(config.dataDir);
	console.error(`Ensured data directory exists: ${config.dataDir}`);
} catch (err) {
	console.error(`Failed to ensure data directory exists: ${config.dataDir}`, err);
	process.exit(1);
}

// Auto-update timer
let updateTimer = null;

/**
 * @typedef {Object} SearchDocsArgs
 * @property {string|string[]} query - The search query using Elasticsearch syntax. Focus on keywords.
 */

class DocsMcpServer {
	constructor() {
		/**
		 * @type {Server}
		 * @private
		 */
		this.server = new Server(
			{
				name: '@crownpeak/dqm-react-component-dev-mcp',
				version: packageVersion,
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.setupToolHandlers();

		// Error handling
		this.server.onerror = (error) => console.error('[MCP Error]', error);
		process.on('SIGINT', async () => {
			if (updateTimer) clearTimeout(updateTimer);
			await this.server.close();
			process.exit(0);
		});
	}

	/**
	 * Set up the tool handlers for the MCP server
	 * @private
	 */
	setupToolHandlers() {
		this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				{
					name: config.toolName,
					description: config.toolDescription,
					inputSchema: {
						type: 'object',
						properties: {
							query: {
								type: 'string',
								description: 'Elasticsearch query string. Focus on keywords and use ES syntax (e.g., "overlay AND config", "DQMSidebar props", "backend authentication").',
							},
							page: {
								type: 'number',
								description: 'Optional page number for pagination of results (e.g., 1, 2, 3...). Default is 1.',
								default: 1,
							}
						},
						required: ['query']
					},
				},
			],
		}));

		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			// Check against the configured tool name
			if (request.params.name !== config.toolName) {
				throw new McpError(
					ErrorCode.MethodNotFound,
					`Unknown tool: ${request.params.name}. Expected: ${config.toolName}`
				);
			}

			try {
				// Log the incoming request for debugging
				console.error(`Received request for tool: ${request.params.name}`);
				console.error(`Request arguments: ${JSON.stringify(request.params.arguments)}`);

				// Ensure arguments is an object
				if (!request.params.arguments || typeof request.params.arguments !== 'object') {
					throw new Error("Arguments must be an object");
				}

				const args = request.params.arguments;

				// Validate required fields
				if (!args.query) {
					throw new Error("Query is required in arguments");
				}

				const result = await this.executeDocsSearch(args);

				return {
					content: [
						{
							type: 'text',
							text: result,
						},
					],
				};
			} catch (error) {
				console.error(`Error executing ${request.params.name}:`, error);
				return {
					content: [
						{
							type: 'text',
							text: `Error executing ${request.params.name}: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		});
	}

	/**
	 * Execute a documentation search
	 * @param {SearchDocsArgs} args - Search arguments
	 * @returns {Promise<string>} Search results
	 * @private
	 */
	async executeDocsSearch(args) {
		try {
			// Always use the configured data directory
			const searchPath = config.dataDir;

			// Create a clean options object
			const options = {
				path: searchPath,
				query: args.query,
				maxTokens: 10000
			};

			console.error("Executing search with options:", JSON.stringify(options, null, 2));

			// Call search with the options object
			const result = await search(options);
			return result;
		} catch (error) {
			console.error('Error executing docs search:', error);
			throw new McpError(
				ErrorCode.MethodNotFound,
				`Error executing docs search: ${error.message || String(error)}`
			);
		}
	}

	/**
	 * Check for updates in the Git repository and pull changes.
	 * @private
	 */
	async checkForUpdates() {
		if (!config.gitUrl || !git) return;

		console.log('Checking for documentation updates...');
		try {
			const isRepo = await git.checkIsRepo();
			if (!isRepo) {
				console.error(`Data directory ${config.dataDir} is not a Git repository. Skipping update.`);
				return;
			}

			await git.fetch();
			const status = await git.status();

			if (status.behind > 0) {
				console.log(`Local branch is ${status.behind} commits behind origin/${status.tracking}. Pulling updates...`);
				await git.pull('origin', config.gitRef);
				console.log('Documentation updated successfully.');
			} else {
				console.log('Documentation is up-to-date.');
			}
		} catch (error) {
			console.error('Error checking for updates:', error);
		} finally {
			if (config.autoUpdateInterval > 0) {
				updateTimer = setTimeout(() => this.checkForUpdates(), config.autoUpdateInterval * 60 * 1000);
			}
		}
	}

	/**
	 * Downloads and extracts a tarball archive from a Git repository URL.
	 * @private
	 */
	async downloadAndExtractTarballRuntime() {
		const match = config.gitUrl.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
		if (!match) {
			console.error(`Cannot determine tarball URL from gitUrl: ${config.gitUrl}. Cannot proceed.`);
			throw new Error('Invalid or unsupported Git URL for tarball download.');
		}

		const owner = match[1];
		const repo = match[2];
		let ref = config.gitRef || 'main';

		const downloadAttempt = async (currentRef) => {
			const tarballUrl = `https://github.com/${owner}/${repo}/archive/${currentRef}.tar.gz`;
			console.log(`Attempting to download archive (${currentRef}) from ${tarballUrl} to ${config.dataDir}...`);

			await fs.emptyDir(config.dataDir);

			const response = await axios({
				method: 'get',
				url: tarballUrl,
				responseType: 'stream',
				validateStatus: (status) => status >= 200 && status < 300,
			});

			await new Promise((resolve, reject) => {
				response.data
					.pipe(
						tar.x({
							strip: 1,
							C: config.dataDir,
						})
					)
					.on('finish', resolve)
					.on('error', reject);
			});
			console.log(`Successfully downloaded and extracted archive (${currentRef}) to ${config.dataDir}`);
		};

		try {
			await downloadAttempt(ref);
		} catch (error) {
			if (ref === 'main' && error.response && error.response.status === 404) {
				console.warn(`Download failed for ref 'main' (404). Retrying with 'master'...`);
				ref = 'master';
				try {
					await downloadAttempt(ref);
				} catch (retryError) {
					console.error(`Retry with 'master' also failed: ${retryError.message}`);
					throw new Error(`Failed to download archive for both 'main' and 'master' refs.`);
				}
			} else {
				console.error(`Error downloading or extracting tarball (${ref}): ${error.message}`);
				throw error;
			}
		}
	}

	async run() {
		try {
			console.error("Starting DQM Docs MCP server...");
			console.error(`Using data directory: ${config.dataDir}`);
			console.error(`MCP Tool Name: ${config.toolName}`);
			console.error(`MCP Tool Description: ${config.toolDescription}`);
			if (config.gitUrl) {
				console.error(`Using Git repository: ${config.gitUrl} (ref: ${config.gitRef})`);
				console.error(`Auto-update interval: ${config.autoUpdateInterval} minutes`);
			} else if (config.includeDir) {
				console.error(`Using static directory: ${config.includeDir}`);
			}

			// Check for runtime overrides and pre-built data
			const args = minimist(process.argv.slice(2));
			const runtimeOverride = args.dataDir || args.gitUrl || args.includeDir ||
				process.env.DATA_DIR || process.env.GIT_URL || process.env.INCLUDE_DIR;

			let usePrebuiltData = false;
			if (!runtimeOverride) {
				try {
					if (fs.existsSync(config.dataDir)) {
						const items = await fs.readdir(config.dataDir);
						if (items.length > 0) {
							usePrebuiltData = true;
							console.error(`Detected non-empty default data directory. Using pre-built content from ${config.dataDir}.`);
						} else {
							console.error(`Default data directory ${config.dataDir} exists but is empty. Will attempt fetch based on config.`);
						}
					} else {
						console.error(`Default data directory ${config.dataDir} does not exist. Will attempt fetch based on config.`);
					}
				} catch (readDirError) {
					console.error(`Error checking default data directory ${config.dataDir}:`, readDirError);
				}
			} else {
				console.error('Runtime content source override detected. Ignoring pre-built data check.');
			}

			// Handle content source initialization
			if (usePrebuiltData) {
				console.error("Skipping content fetch, using pre-built data.");
				if (updateTimer) clearTimeout(updateTimer);
				updateTimer = null;
			} else if (config.gitUrl) {
				if (config.autoUpdateInterval > 0) {
					console.error(`Auto-update enabled. Initializing Git for ${config.dataDir}...`);
					if (!git) git = simpleGit(config.dataDir);
					const isRepo = await git.checkIsRepo();

					if (!isRepo) {
						console.error(`Directory ${config.dataDir} is not a Git repository. Attempting initial clone...`);
						try {
							await fs.emptyDir(config.dataDir);
							await simpleGit().clone(config.gitUrl, config.dataDir, ['--branch', config.gitRef, '--depth', '1']);
							console.error(`Successfully cloned ${config.gitUrl} to ${config.dataDir}`);
						} catch (cloneError) {
							console.error(`Error during initial clone:`, cloneError);
							process.exit(1);
						}
					}
					console.error(`Directory ${config.dataDir} is a Git repository. Proceeding with update check.`);
					await this.checkForUpdates();
				} else {
					console.error(`Auto-update disabled. Initializing content from tarball for ${config.gitUrl}...`);
					try {
						await this.downloadAndExtractTarballRuntime();
					} catch (tarballError) {
						console.error(`Failed to initialize from tarball:`, tarballError);
						process.exit(1);
					}
					if (updateTimer) clearTimeout(updateTimer);
					updateTimer = null;
				}
			} else if (config.includeDir && !runtimeOverride) {
				console.error(`Warning: Config specifies includeDir (${config.includeDir}) but data dir (${config.dataDir}) is empty/missing and no runtime override provided.`);
				if (updateTimer) clearTimeout(updateTimer);
				updateTimer = null;
			} else if (!runtimeOverride) {
				console.error(`No content source specified and no pre-built data found in ${config.dataDir}. Server may have no data to search.`);
				if (updateTimer) clearTimeout(updateTimer);
				updateTimer = null;
			}

			// Connect the server to the transport
			const transport = new StdioServerTransport();
			await this.server.connect(transport);
			console.error('DQM Docs MCP server running on stdio');
		} catch (error) {
			console.error('Error starting server:', error);
			process.exit(1);
		}
	}
}

const server = new DocsMcpServer();
server.run().catch(console.error);
