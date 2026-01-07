The Crownpeak DQM React Component provides an MCP (Model Context Protocol) server for AI-powered documentation search. This enables AI assistants like Claude, GitHub Copilot, and Cline to search and understand the DQM documentation.

## Table of Contents

- [Overview](#overview)
- [Benefits](#benefits)
- [Installation](#installation)
  - [Claude Desktop](#claude-desktop)
  - [VS Code Copilot](#vs-code-copilot)
  - [Cline](#cline)
  - [OpenAI Codex CLI](#openai-codex-cli)
- [Usage](#usage)
  - [Example Queries](#example-queries)
- [Dynamic Usage](#dynamic-usage)
- [Documentation Coverage](#documentation-coverage)
- [Troubleshooting](#troubleshooting)
- [Related Links](#related-links)

---

## Overview

| Feature | Description |
|---------|-------------|
| **Powered by** | [Probe](https://probeai.dev/) search engine |
| **Configuration** | Zero setup - just `npx` |
| **Tool Name** | `search_dqm_docs` |
| **Package** | `@crownpeak/dqm-react-component-dev-mcp` |

The MCP server indexes all DQM documentation and makes it searchable by AI assistants. When you ask a question about DQM, your AI assistant can automatically search the documentation to provide accurate, up-to-date answers.

---

## Benefits

### For Developers Integrating DQM

The MCP server is especially useful when you're **integrating the DQM component into your application**:

- **Step-by-Step Guidance**: Ask your AI assistant "How do I add DQMSidebar to my React app?" and get accurate, contextual instructions
- **Configuration Help**: Get instant answers about props, overlay detection, authentication modes
- **Code Generation**: AI can generate correctly configured DQMSidebar code based on your specific requirements
- **Troubleshooting**: When something doesn't work, the AI can search the documentation for solutions

**Example workflow:**
```
You: "I want to add DQM to my Next.js app with backend authentication"
AI: [searches docs] Here's how to set it up...
     1. Install the package
     2. Configure authBackendUrl
     3. Set up the backend server
     [provides code examples from documentation]
```

### General Benefits

- **Faster Answers**: Get instant, accurate answers about DQMSidebar configuration, props, and usage patterns
- **Context-Aware Help**: AI understands the full documentation, not just snippets
- **Always Up-to-Date**: Pre-built documentation bundle ensures you get the latest information

### For AI Assistants

- **Structured Search**: Semantic search across all documentation files
- **Code Examples**: Access to real code samples from the repository
- **Type Information**: Full TypeScript type definitions included

---

## Installation

### Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dqm-docs": {
      "command": "npx",
      "args": [
        "-y",
        "@crownpeak/dqm-react-component-dev-mcp@latest"
      ]
    }
  }
}
```

Restart Claude Desktop after saving the configuration.

---

### VS Code Copilot

Add to your VS Code MCP configuration (`.vscode/mcp.json` in your project or workspace):

```json
{
  "servers": {
    "dqm-docs": {
      "command": "npx",
      "args": ["-y", "@crownpeak/dqm-react-component-dev-mcp@latest"]
    }
  }
}
```

---

### Cline

Add to your project's `.cline/mcp_config.json`:

```json
{
  "mcpServers": {
    "dqm-docs": {
      "command": "npx",
      "args": ["-y", "@crownpeak/dqm-react-component-dev-mcp@latest"]
    }
  }
}
```

---

### OpenAI Codex CLI

Add to your project's `codex.toml` or global `~/.codex/config.toml`:

```toml
[mcp_servers.dqm-docs]
command = "npx"
args = ["-y", "@crownpeak/dqm-react-component-dev-mcp@latest"]
```

Or with environment variables:

```toml
[mcp_servers.dqm-docs]
command = "npx"
args = ["-y", "@crownpeak/dqm-react-component-dev-mcp@latest"]

[mcp_servers.dqm-docs.env]
NODE_ENV = "production"
```

---

## Usage

Once configured, you can ask your AI assistant questions about DQM. The AI will automatically use the `search_dqm_docs` tool to find relevant documentation.

### Example Queries

**Configuration Questions:**
- "How do I configure overlay detection in DQMSidebar?"
- "What props does DQMSidebar accept?"
- "How do I set up backend authentication?"

**Integration Questions:**
- "How do I integrate the widget bundle?"
- "How do I use DQM with Next.js?"
- "What's the difference between direct and backend authentication?"

**Troubleshooting:**
- "What is manualOffset and when should I use it?"
- "How do I fix z-index issues with the sidebar?"
- "Why isn't my overlay being detected?"

**Code Examples:**
- "Show me an example of DQMSidebar with AI translation"
- "How do I change the language programmatically?"

### Search Keywords

For best results, try these search patterns:

```
"DQMSidebar overlayConfig"
"backend authentication setup"
"widget bundle integration"
"manualOffset configuration"
"AI translation config"
"i18n language switch"
```

---

## Dynamic Usage

Instead of the pre-built package, you can point directly to the GitHub repository for the most recent documentation:

```json
{
  "mcpServers": {
    "dqm-docs": {
      "command": "npx",
      "args": [
        "-y",
        "@probelabs/docs-mcp@latest",
        "--gitUrl",
        "https://github.com/Crownpeak/dqm-react-component",
        "--toolName",
        "search_dqm_docs",
        "--toolDescription",
        "Search Crownpeak DQM React Component documentation"
      ]
    }
  }
}
```

> **Note:** Dynamic mode fetches from GitHub on each query, which may be slower than the pre-built package.

---

## Documentation Coverage

The MCP server indexes all documentation including:

| Source | Content |
|--------|---------|
| `README.md` | Overview and quick start |
| `docs/` | Full documentation (QUICKSTART, DEVELOPMENT, SERVER, EXAMPLES, AI-FEATURES, etc.) |
| `src/` | Source code with JSDoc comments |
| `.github/copilot-instructions.md` | AI agent integration guide |

### Indexed Topics

- DQMSidebar component and props
- Authentication (direct and backend modes)
- AI features (translation, summaries)
- Internationalization (i18n)
- Overlay detection and positioning
- Widget bundle integration
- Backend server setup
- Redis session storage
- TypeScript types and interfaces

---

## Troubleshooting

### MCP Server Not Starting

**Symptoms:** AI assistant doesn't recognize DQM-related questions or `search_dqm_docs` tool is not available.

**Solutions:**

1. **Check Node.js**: Ensure Node.js 18+ is installed
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **Verify Configuration**: Ensure JSON syntax is correct
   ```bash
   # Test the command manually
   npx -y @crownpeak/dqm-react-component-dev-mcp@latest
   ```

3. **Restart AI Client**: After configuration changes, restart Claude Desktop/VS Code

4. **Check Logs**: 
   - Claude Desktop: View → Developer → Open Logs
   - VS Code: Output panel → MCP

### Search Returns No Results

**Solutions:**

1. **Simplify Query**: Use shorter, more specific terms
   ```
   ❌ "How do I configure the overlay detection feature to work with my custom toolbar?"
   ✅ "overlayConfig toolbar"
   ```

2. **Use Known Terms**: Reference actual API names
   ```
   ✅ "DQMSidebar props"
   ✅ "manualOffset"
   ✅ "authBackendUrl"
   ```

### Outdated Information

If documentation seems outdated:

1. **Update Package**: Force latest version
   ```bash
   npx -y @crownpeak/dqm-react-component-dev-mcp@latest
   ```

2. **Use Dynamic Mode**: Point to GitHub repository directly (see [Dynamic Usage](#dynamic-usage))

---

## Related Links

- [DQM React Component on GitHub](https://github.com/Crownpeak/dqm-react-component)
- [Probe Search Engine](https://probeai.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [@probelabs/docs-mcp](https://github.com/probelabs/docs-mcp)
- [MCP Server Package on npm](https://www.npmjs.com/package/@crownpeak/dqm-react-component-dev-mcp)
