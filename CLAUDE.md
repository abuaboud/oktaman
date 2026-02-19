# OktaMan - Claude Development Guide

## Project Overview

OktaMan is a monorepo project built with TypeScript that provides an AI-powered chat interface. The project uses Turbo for orchestrating builds across multiple packages.

## Project Structure

```
oktaman/
├── packages/
│   ├── server/     # Backend API (Fastify + TypeScript)
│   ├── ui/         # Frontend (React + Vite + TypeScript)
│   ├── shared/     # Shared types and utilities
│   └── docs/       # Mintlify documentation site
├── package.json    # Root package with workspace configuration
└── turbo.json      # Turbo build configuration
```

## Technology Stack

### Backend (packages/server)
- **Runtime**: Node.js >=18.0.0
- **Framework**: Fastify ~5.7.4
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL with TypeORM 0.3.28
- **Real-time**: Socket.io 4.8.3
- **AI/ML**: Vercel AI SDK, OpenRouter, Composio
- **Authentication**: Supabase, JWT

### Frontend (packages/ui)
- **Framework**: React 18/19
- **Build Tool**: Vite 6.0.6
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: React Router Dom 7.1.3
- **Real-time**: Socket.io-client 4.8.3

### Shared (packages/shared)
- Common types, interfaces, and utilities shared between server and ui

## Build & Development Commands

All commands should be run from the project root unless otherwise specified.

### Development
```bash
npm run dev          # Start all packages in development mode
```

### Building
```bash
npm run build        # Build all packages using Turbo
```

### Linting & Formatting
```bash
npm run lint         # Lint all packages
npm run format       # Format code with Prettier
```

### Clean
```bash
npm run clean        # Remove all dist/build folders
```

## Package-Specific Details

### Server Build Process
The server build (`packages/server/package.json:7`) includes:
1. TypeScript compilation (`tsc`)
2. Copying prompt templates to dist
3. Copying tool configurations to dist
4. Copying `.mjs` files to dist

### UI Build Process
The UI build (`packages/ui/package.json:8`) includes:
1. TypeScript type checking (`tsc`)
2. Vite production build

## Key Conventions

### Code Style
- Use TypeScript for all source files
- Follow ESLint rules configured in each package
- Use Prettier for code formatting
- Prefer functional components in React

### Component Patterns (UI)
- Use Radix UI primitives for accessible components
- Apply Tailwind CSS for styling
- Use `class-variance-authority` for component variants
- Implement proper TypeScript interfaces for all props
- Add `key` props when rendering lists or conditional components that should remount on state changes

### API Patterns (Server)
- Use Fastify for HTTP routes
- Apply Zod schemas for validation with `fastify-type-provider-zod`
- Use TypeORM entities for database models
- Implement proper error handling with `@fastify/sensible`

### Error Handling
- **Use Go-style error handling** with `tryCatch` and `tryCatchSync` from `@oktaman/shared`
- Prefer explicit error handling over try-catch blocks for better readability
- Always check for errors before using the result

Example:
```typescript
import { tryCatch, tryCatchSync } from '@oktaman/shared';

// Async operations
const [error, user] = await tryCatch(fetchUser(id));
if (error) {
  logger.error({ error }, 'Failed to fetch user');
  return null;
}
// Use user safely here

// Sync operations
const [parseError, data] = tryCatchSync(() => JSON.parse(jsonString));
if (parseError) {
  logger.error({ error: parseError }, 'Failed to parse JSON');
  return null;
}
// Use data safely here
```

### State Management
- Reset component state when needed by using `key` prop with changing values
- Use TanStack Query for server state
- Use React hooks for local state
- Avoid prop drilling by using context where appropriate

### Real-time Communication
- Use Socket.io for bidirectional real-time updates
- Implement proper event handlers and cleanup

### Question/Answer Flow
- Single choice questions should show "Next" button for intermediate questions and "Send" for the last
- Multiple choice questions should show "Next Question" for intermediate and "Submit Answers" for the last
- Text inputs should submit on Enter key (Shift+Enter for multiline)
- Component state should reset between questions using the `key` prop

## Important Notes

### Git Workflow
- Branch: `main` is the primary branch
- Use conventional commit messages
- Run builds before committing to catch TypeScript errors

### Environment Variables
- Server uses `dotenv` and `env-var` for configuration
- Supabase credentials required for authentication and database
- AI provider API keys required (OpenAI, Anthropic, etc.)

### Database
- PostgreSQL is the primary database
- TypeORM for ORM with migrations
- Supabase for authentication and real-time features

### Testing
- Tests should be run before committing
- Ensure all TypeScript compilation passes

## Troubleshooting

### Build Errors
1. Clean build artifacts: `npm run clean`
2. Remove node_modules: `rm -rf node_modules package-lock.json`
3. Reinstall: `npm install`
4. Rebuild: `npm run build`

### TypeScript Errors
- Ensure all packages are built in the correct order (Turbo handles this)
- Check that shared package types are exported correctly
- Verify all imports use correct paths

### Development Server Issues
- Check that ports are available (UI: 4200, Server: varies)
- Verify environment variables are set correctly
- Check database connection

## AI Integration

The project integrates with multiple AI providers:
- Anthropic Claude (via AI SDK)
- OpenAI (via AI SDK)
- OpenRouter (for multiple model access)
- Composio (for tool integration)

### Question Prompts
The UI includes a sophisticated question/answer system with:
- Single choice questions with optional custom input
- Multiple choice questions with checkboxes
- Connection card questions for authentication flows
- Progress tracking ("Ask X of Y")
- Auto-resetting state between questions

### Skills System
The server includes a skills system for specialized domain knowledge and workflows:

**Source Location**: `packages/server/src/app/oktaman/skills/`
**Runtime Location**: `~/.oktaman/home/skills/`

**How It Works**:
- Skills are defined in the source code directory during development
- On first load, skills are automatically copied to `~/.oktaman/home/skills/`
- The AI agent accesses skills via absolute paths in `~/.oktaman/home/skills/`
- All paths returned by `skillsLoader.list()` are absolute paths

**Structure**:
```
# Source (development)
packages/server/src/app/oktaman/skills/
├── index.ts           # Skills loader with list() function
├── types.ts           # SkillMetadata interface
└── [skill-name]/      # Individual skill directories
    ├── SKILL.md       # Skill definition with frontmatter
    └── references/    # Optional reference docs and supporting files

# Runtime (copied to)
~/.oktaman/home/skills/
└── [skill-name]/      # Individual skill directories (copied from source)
    ├── SKILL.md       # Skill definition with frontmatter
    └── references/    # Optional reference docs and supporting files
```

**SKILL.md Format**:
```markdown
---
name: skill-name
description: Brief description of what the skill does
---

# Skill Name

Detailed instructions, examples, and workflows...
```

**Usage**:
```typescript
import { skillsLoader, buildSkillsPrompt } from './skills';

// List all available skills
const skills = await skillsLoader.list();
// Returns: SkillMetadata[] with { name, description, path }
// path is absolute: /Users/username/.oktaman/home/skills/skill-name/SKILL.md

// Build skills prompt for system prompt
const skillsPrompt = buildSkillsPrompt(skills);
// Returns formatted markdown for inclusion in system prompt
```

**Adding New Skills**:
1. Create a new directory in `packages/server/src/app/oktaman/skills/` with a kebab-case name
2. Add a `SKILL.md` file with YAML frontmatter (name, description)
3. Include step-by-step instructions and examples in the markdown
4. Optionally add supporting files in a `references/` subdirectory
5. Add the skill name to the `SKILLS` array in `skills/index.ts`
6. Skills will be automatically copied to `~/.oktaman/home/skills/` on first load

**Skills Prompt Guide**: `packages/server/src/app/oktaman/prompts/skills.md`

## Documentation

The `packages/docs/` package contains the Mintlify-powered documentation site for OktaMan.

### Working Relationship

When asked to update or create documentation, write clear, accurate, and helpful content that reflects the current state of the codebase. Do not guess at API behavior — read the relevant source files first.

### Project Context

- All documentation pages are `.mdx` files located in `packages/docs/`
- The site configuration lives in `packages/docs/docs.json` (Mintlify's modern config format — do **not** use `mint.json`)
- Pages are registered under the `navigation` key in `docs.json`

### Content Strategy

- Write for developers integrating with or building on OktaMan
- Prefer short, scannable sections over long prose
- Use Mintlify components (`<Card>`, `<CardGroup>`, `<Tabs>`, `<CodeGroup>`, `<Note>`, `<Warning>`, etc.) to improve readability
- Code examples should be copy-pasteable and correct

### docs.json Schema Reference

Key fields:

```json
{
  "$schema": "https://mintlify.com/docs.json",
  "name": "Site name",
  "theme": "mint",
  "navigation": [
    {
      "group": "Group Name",
      "pages": ["page-slug", "nested/page-slug"]
    }
  ],
  "tabs": [
    { "name": "Tab Name", "url": "tab-prefix" }
  ]
}
```

- `pages` entries are file paths relative to `packages/docs/`, without the `.mdx` extension
- Add every new page to `navigation` or it will not appear in the sidebar

### Frontmatter Requirements

Every `.mdx` file must start with:

```yaml
---
title: Page Title
description: One-sentence description shown in search and meta tags.
---
```

Optional fields: `icon`, `mode` (`"wide"` for full-width layout).

### Writing Standards

- Use sentence case for headings (e.g., "Getting started" not "Getting Started")
- Heading hierarchy: `##` for top-level sections, `###` for subsections — never skip levels
- Wrap inline code in backticks; use fenced code blocks with a language tag for multi-line snippets
- Prefer active voice and second-person ("you") address

### Git Workflow

- Documentation changes follow the same conventional commit style as the rest of the monorepo
- Prefix commits with `docs:` (e.g., `docs: add skills system overview`)
- Do not commit generated `.mintlify/` artifacts — they are gitignored

### Do Not

- Do not edit `docs.json` navigation without also creating the corresponding `.mdx` file
- Do not use deprecated `mint.json` format
- Do not add documentation for unimplemented features
- Do not commit broken MDX (run `npm run build` in `packages/docs/` to verify)
