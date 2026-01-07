# @crownpeak/dqm-react-component-dev-mcp

MCP Server for Crownpeak DQM React Component documentation - powered by [Probe](https://probeai.dev/).

This MCP server provides intelligent documentation search for AI assistants, enabling them to find information about DQMSidebar configuration, overlay detection, backend authentication, widget integration, and more.

## Features

- **Powered by Probe**: Uses the [Probe](https://probeai.dev/) search engine for fast, relevant results
- **Pre-built Documentation**: All DQM documentation is bundled into the package
- **Zero Configuration**: Just run with `npx` - no setup required
- **AI Integration**: Seamlessly integrates with AI assistants via Model Context Protocol (MCP)

## Quick Start

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

### VS Code Copilot

Add to your VS Code MCP configuration (`.vscode/mcp.json`):

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

### OpenAI Codex CLI

Add to your project's `codex.toml` or global `~/.codex/config.toml`:

```toml
[mcp_servers.dqm-docs]
command = "npx"
args = ["-y", "@crownpeak/dqm-react-component-dev-mcp@latest"]
```

## Usage

Once configured, you can ask your AI assistant questions about DQM:

- "How do I configure overlay detection in DQMSidebar?"
- "What props does DQMSidebar accept?"
- "How do I set up backend authentication?"
- "How do I integrate the widget bundle?"
- "What is manualOffset and when should I use it?"

The AI will use the `search_dqm_docs` tool to find relevant documentation.

## Example Queries

```
"DQMSidebar overlayConfig"
"backend authentication setup"
"widget bundle integration"
"manualOffset configuration"
"z-index issues"
```

## Dynamic Usage (Alternative)

Instead of the pre-built package, you can point directly to the GitHub repository:

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

## Documentation Coverage

This MCP server indexes all documentation including:

- **README.md** - Overview and quick start
- **docs/** - Full documentation (QUICKSTART, DEVELOPMENT, SERVER, EXAMPLES, etc.)
- **src/** - Source code with JSDoc comments
- **.github/copilot-instructions.md** - AI agent integration guide

## Related

- [DQM React Component](https://github.com/Crownpeak/dqm-react-component)
- [Probe Search Engine](https://probeai.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [@probelabs/docs-mcp](https://github.com/probelabs/docs-mcp)

## License

MIT © Crownpeak Technology GmbH
