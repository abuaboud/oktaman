<p align="center">
  <img src="packages/ui/public/chad-oktaman.png" alt="OktaMan" width="200" />
</p>

<h1 align="center">OktaMan</h1>

<p align="center">
  <strong>Your AI-powered command center that runs locally.</strong><br>
  One place to manage your life, automate tasks, and get things done — all from your machine.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#supported-providers">Providers</a> &middot;
  <a href="#cli-reference">CLI</a> &middot;
  <a href="#development">Development</a>
</p>

---

<p align="center">
  <img src="assets/main-page.png" alt="OktaMan Main Page" width="800" />
</p>

<p align="center">
  <img src="assets/kanban-board.png" alt="OktaMan Kanban Board" width="800" />
</p>

---

## Quick start

```bash
curl -fsSL https://raw.githubusercontent.com/AbuAboud/oktaman/main/scripts/install.sh | bash
```

The installer downloads OktaMan, bundles a Node.js runtime, registers a background service (launchd on macOS, systemd on Linux), and adds `oktaman` to your PATH.

Once installed, OktaMan runs as a background service at **http://localhost:4321**.

```bash
oktaman setup      # Configure your AI provider, tools, and Telegram
oktaman open       # Open in browser
```

On first launch, run `oktaman setup` to connect your AI provider. You can re-run it anytime or change settings from the web UI.

## Features

- **Command center** — A single hub to chat, delegate tasks, and orchestrate your digital life
- **Agents** — Deploy autonomous agents with custom prompts, tools, and schedules that work in the background
- **Tools** — Execute bash commands, browse the web, scrape pages, manage to-dos, and more — all from the chat
- **Memory** — Persistent long-term memory across sessions so context is never lost
- **Skills** — Extensible skill system for specialized domain knowledge and workflows
- **Telegram** — Connect a Telegram bot so your assistant is always reachable from your phone
- **Integrations** — Plug in external services (Gmail, Google Calendar, Slack, GitHub, and more) via Composio
- **Multi-model** — Bring your own provider — OpenRouter, OpenAI, or Ollama for local models
- **100% local** — SQLite database at `~/.oktaman/`, nothing sent anywhere you don't control

## Supported providers

OktaMan supports three AI provider backends. Choose the one that fits your setup.

### OpenRouter (recommended)

Access many models through a single API key. Get one at [openrouter.ai/keys](https://openrouter.ai/keys).

| Model | Provider |
|-------|----------|
| Claude Sonnet 4.6 | Anthropic |
| Gemini 3.1 Pro | Google |
| Qwen 3.5 Plus | Qwen |
| Kimi K2.5 | Moonshot AI |
| MiniMax M2.5 | MiniMax |

### OpenAI

Use your OpenAI API key directly.

| Model | Provider |
|-------|----------|
| GPT-5.2 | OpenAI |

### Ollama (local)

Run models locally with [Ollama](https://ollama.com). No API key needed.

| Model | Provider |
|-------|----------|
| Kimi K2.5 | Ollama |
| MiniMax M2.5 | Ollama |

> Embedding models are also supported for each provider (OpenAI text-embedding-3-small/large, Nomic Embed Text for Ollama).

## CLI reference

```
oktaman <command>
```

| Command | Description |
|---------|-------------|
| `setup` | Interactive wizard to configure AI provider, tools, and Telegram |
| `start` | Start the background service |
| `stop` | Stop the background service |
| `restart` | Restart the background service |
| `status` | Show whether OktaMan is running and its URL |
| `logs [N]` | Show the last N log lines (default: 50) |
| `open` | Open OktaMan in your default browser |
| `update` | Update to the latest version |
| `uninstall` | Remove OktaMan (preserves your data) |
| `run` | Run in the foreground for debugging |
| `version` | Show the installed version |
| `help` | Show all commands |


## How it works

```
oktaman/
├── packages/
│   ├── server/   # Fastify API, AI orchestration, tools, database
│   ├── ui/       # React frontend with real-time chat interface
│   └── shared/   # Shared types and utilities
└── bin/
    └── oktaman-cli  # CLI entry point
```

The server handles AI model routing, tool execution, agent scheduling, and persistent storage. The UI connects over WebSockets for real-time streaming. Everything runs on your machine.

## Configuration

All data lives in `~/.oktaman/`:

| Path | Description |
|------|-------------|
| `~/.oktaman/data.db` | SQLite database |
| `~/.oktaman/home/` | Working directory for agents |
| `~/.oktaman/home/skills/` | Installed skills |
| `~/.oktaman/storage/` | File uploads and attachments |
| `~/.oktaman/logs/` | Service logs (stdout/stderr) |

### Settings

Configure these through `oktaman setup` or the Settings page in the web UI.

| Setting | Description |
|---------|-------------|
| **AI Provider** | OpenRouter, OpenAI, or Ollama |
| **API Key** | Required for OpenRouter and OpenAI |
| **Default Model** | Chat model to use (default: Kimi K2.5 on OpenRouter) |
| **Composio API Key** | Optional — enables external service integrations (Gmail, Slack, etc.) |
| **Firecrawl API Key** | Optional — enables web scraping and search tools |
| **Telegram Bot Token** | Optional — connects a Telegram bot for mobile access |

## Development

```bash
npm run dev     # Start server + UI with hot reload
npm run build   # Build all packages
npm run lint    # Lint all packages
npm run test    # Run tests
npm run clean   # Remove build artifacts
```

Dev server runs at `http://localhost:4200` (proxies API calls to the backend at port 4321).

### Tech stack

**Backend:** Fastify, TypeORM, SQLite, Socket.IO, Vercel AI SDK

**Frontend:** React, Vite, TanStack Query, Tailwind CSS, Radix UI

## Troubleshooting

**Database errors** — Delete `~/.oktaman/data.db` and restart. It will be recreated.

**Port in use** — Kill the process: `lsof -ti:4321 | xargs kill`

**API key not working** — Verify the key in Settings and check it has credits.

**Service not starting** — Run `oktaman run` to start in foreground and see errors directly.

## License

MIT
