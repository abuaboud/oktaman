# OktaMan - Local AI Assistant

OktaMan is a local AI assistant that runs entirely on your machine with no authentication required.

## Quick Start

### Installation & Running

1. **Build the project:**
   ```bash
   npm install
   npm run build
   ```

2. **Start OktaMan:**
   ```bash
   npx oktaman
   # or
   npm start
   ```

   This will:
   - Start the server at http://localhost:4321
   - Create a local database at `~/.oktaman/data.db`
   - Automatically open your browser

### First Time Setup

1. Once OktaMan opens in your browser, click on **Settings** in the sidebar
2. Add your **OpenRouter API Key** (required for AI chat functionality)
   - Get your key from: https://openrouter.ai/keys
3. Optionally configure:
   - **Composio API Key** - For external tool integrations
   - **E2B API Key** - For code execution sandbox
   - **Default Model ID** - Choose your preferred AI model (default: `anthropic/claude-3.5-sonnet`)
   - **Sandbox ID** - Custom E2B sandbox identifier
4. Click **Save Settings**

### Usage

- **Chat**: Start a new conversation from the home page
- **Agents**: Create custom AI agents with specific prompts and tools
- **Sessions**: View and manage your chat history
- **Connections**: Connect external services via Composio
- **Channels**: Set up Telegram integrations

### Data Storage

All data is stored locally:
- **Database**: `~/.oktaman/data.db` (SQLite)
- **Uploads**: `~/.oktaman/uploads/` (file attachments)

### Stopping OktaMan

Press `Ctrl+C` in the terminal where OktaMan is running.

## Development

### Project Structure

```
oktaman/
├── packages/
│   ├── server/     # Fastify backend API
│   ├── ui/         # React frontend
│   └── shared/     # Shared types and utilities
├── bin/
│   └── oktaman.js    # CLI entry point
└── package.json
```

### Development Mode

Run both server and UI in development mode with hot reload:

```bash
npm run dev
```

This starts:
- Server at http://localhost:4321
- UI dev server at http://localhost:4200 (proxies to server)

### Building

```bash
npm run build
```

### Tech Stack

**Backend:**
- Fastify (API server)
- SQLite with better-sqlite3 (local database)
- TypeORM (database ORM)
- Socket.IO (real-time updates)
- Vercel AI SDK (AI integration)

**Frontend:**
- React 18
- Vite (build tool)
- TanStack Query (state management)
- Tailwind CSS (styling)
- Radix UI (components)

## Features

### AI Chat
- Multi-model support via OpenRouter
- Streaming responses
- Conversation history
- File attachments

### Custom Agents
- Define custom AI agents with specific prompts
- Configure tools and capabilities
- Test agents in sandbox environment

### Memory System
- Semantic search with vector embeddings
- Persistent memory across sessions

### Integrations
- Composio for external tools (Gmail, GitHub, etc.)
- Telegram channel integration
- E2B for code execution

### Skills System
- Extensible skill framework
- Custom domain knowledge and workflows

## Troubleshooting

**Database errors:**
- Delete `~/.oktaman/data.db` to reset the database
- It will be recreated on next startup

**Port already in use:**
- Kill any process using port 4321: `lsof -ti:4321 | xargs kill`
- Or change the port in `bin/oktaman.js` (search for PORT environment variable)

**API key not working:**
- Verify the key is correctly entered in Settings
- Check that the key has sufficient credits
- Try a different model ID

## License

MIT
