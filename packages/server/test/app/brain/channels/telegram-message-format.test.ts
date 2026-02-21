import { describe, it, expect } from 'vitest'
import { toTelegramMarkdown } from '../../../../src/app/brain/channels/telegram-channel-handler'

describe('toTelegramMarkdown – MarkdownV2 safety', () => {

    // ── Special character escaping ──

    it('should escape dots in plain text', () => {
        const result = toTelegramMarkdown('Smart move. Keep it clean.')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should escape dots after backslash-period combos from original markdown', () => {
        const input = 'He took office in January 2025.\n\nWanna keep testing?'
        const result = toTelegramMarkdown(input)
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should escape exclamation marks', () => {
        const result = toTelegramMarkdown('Hello! How are you!')
        expect(result).not.toMatch(/(?<!\\)!/)
    })

    it('should escape plus and equals signs', () => {
        const result = toTelegramMarkdown('2 + 2 = 4')
        expect(result).not.toMatch(/(?<!\\)\+/)
        expect(result).not.toMatch(/(?<!\\)=/)
    })

    it('should escape hash signs', () => {
        const result = toTelegramMarkdown('Issue #42 is open')
        expect(result).not.toMatch(/(?<!\\)#/)
    })

    it('should escape pipe characters', () => {
        const result = toTelegramMarkdown('a | b | c')
        expect(result).not.toMatch(/(?<!\\)\|/)
    })

    it('should escape curly braces', () => {
        const result = toTelegramMarkdown('{ key: value }')
        expect(result).not.toMatch(/(?<!\\)\{/)
        expect(result).not.toMatch(/(?<!\\)\}/)
    })

    it('should escape parentheses', () => {
        const result = toTelegramMarkdown('Price is $10 (with tax).')
        expect(result).toContain('with tax')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should escape dashes in plain text', () => {
        const result = toTelegramMarkdown('First item - second item')
        expect(result).toContain('First item')
        expect(result).toContain('second item')
    })

    it('should escape square brackets', () => {
        const result = toTelegramMarkdown('Check [docs] for info.')
        expect(result).toContain('docs')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should escape tilde characters', () => {
        const result = toTelegramMarkdown('About ~500 items')
        expect(result).not.toMatch(/(?<!\\)~/)
    })

    it('should escape underscores in plain text', () => {
        const result = toTelegramMarkdown('my_var_name')
        expect(result).not.toMatch(/(?<!\\)_/)
    })

    it('should escape asterisks in plain text', () => {
        const result = toTelegramMarkdown('**bold** text')
        expect(result).not.toMatch(/(?<!\\)\*/)
    })

    it('should not double-escape already escaped characters', () => {
        const result = toTelegramMarkdown('Hello world.')
        expect(result).toContain('\\.')
        expect(result).not.toContain('\\\\.')
    })

    it('should not produce empty output', () => {
        const result = toTelegramMarkdown('Hello, how are you?')
        expect(result.trim().length).toBeGreaterThan(0)
    })

    // ── Code blocks ──

    it('should not escape characters inside code blocks', () => {
        const input = '```\nconst x = 1.5 + 2;\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('const x = 1.5 + 2')
    })

    it('should preserve code block with language tag', () => {
        const input = '```javascript\nconst x = 1;\nconsole.log(x);\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('```')
        expect(result).toContain('const x = 1;')
        expect(result).toContain('console.log(x);')
    })

    it('should not escape dots inside code blocks', () => {
        const input = '```\nobj.method().value\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('obj.method().value')
    })

    it('should not escape exclamation marks inside code blocks', () => {
        const input = '```\nconsole.log("Hello!");\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('Hello!')
    })

    it('should not escape special chars inside code blocks', () => {
        const input = '```\nif (a + b === c) { return true; }\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('a + b === c')
        expect(result).toContain('{ return true; }')
    })

    it('should handle code block with typescript content', () => {
        const input = '```typescript\nimport { Request, Response } from "express";\n\nexport async function handle(req: Request, res: Response) {\n  const { id } = req.params;\n  return res.json({ success: true });\n}\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('import { Request, Response }')
        expect(result).toContain('export async function handle')
        expect(result).toContain('res.json({ success: true })')
    })

    it('should handle multiple code blocks in one message', () => {
        const input = 'First:\n\n```python\nprint("hello")\n```\n\nSecond:\n\n```bash\necho hello\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('print("hello")')
        expect(result).toContain('echo hello')
    })

    it('should handle code block at the start of message', () => {
        const input = '```\nhello world\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('hello world')
        expect(result).toContain('```')
    })

    it('should handle code block with pipes (table-like)', () => {
        const input = '```\n| col1 | col2 |\n|------|------|\n| a    | b    |\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('| col1 | col2 |')
    })

    it('should handle code block with bash commands', () => {
        const input = '```bash\nnpm install express.js\necho "Done!"\nexport NODE_ENV=production\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('npm install express.js')
        expect(result).toContain('echo "Done!"')
        expect(result).toContain('NODE_ENV=production')
    })

    it('should escape text before and after code blocks', () => {
        const input = 'Here is the fix:\n\n```\ncode here\n```\n\nTry this.'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('code here')
        // Text outside code block should have dots escaped
        const outsideCode = result.replace(/```[\s\S]*?```/g, '')
        expect(outsideCode).not.toMatch(/(?<!\\)\./)
    })

    it('should handle code block with JSON content', () => {
        const input = '```json\n{\n  "name": "test",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "node index.js"\n  }\n}\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('"name": "test"')
        expect(result).toContain('"version": "1.0.0"')
    })

    it('should handle code block with SQL content', () => {
        const input = '```sql\nSELECT * FROM users WHERE id = 1 AND active = true;\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('SELECT * FROM users')
        expect(result).toContain('active = true;')
    })

    // ── Inline code ──

    it('should not escape characters inside inline code', () => {
        const input = 'Run `npm install --save`'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('npm install --save')
    })

    it('should not escape dots inside inline code', () => {
        const input = 'Use `obj.method()` to call it'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('obj.method()')
    })

    it('should not escape plus/equals inside inline code', () => {
        const input = 'Result: `x + y = 3`'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('x + y = 3')
    })

    it('should handle multiple inline code spans', () => {
        const input = 'Use `const` or `let` but not `var`.'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('`const`')
        expect(result).toContain('`let`')
        expect(result).toContain('`var`')
    })

    it('should handle inline code with special characters', () => {
        const input = 'Pattern: `[a-z]+\\.txt`'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('[a-z]+')
    })

    // ── Links ──

    it('should preserve link formatting', () => {
        const result = toTelegramMarkdown('Visit [Google](https://google.com) now.')
        expect(result).toContain('[Google]')
        expect(result).toContain('google')
    })

    it('should handle links with special chars in text', () => {
        const result = toTelegramMarkdown('See [v1.0 Release!](https://example.com)')
        expect(result).toContain('[')
        expect(result).toContain('Release')
        expect(result).toContain('example.com')
    })

    // ── Mixed content ──

    it('should handle text with code block and inline code together', () => {
        const input = 'Use `const x = 1` or a full block:\n\n```\nconst x = 1;\nconst y = 2;\n```\n\nResult: `x + y = 3`'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('`const x = 1`')
        expect(result).toContain('const x = 1;\nconst y = 2;')
        expect(result).toContain('`x + y = 3`')
    })

    it('should handle realistic AI response with code', () => {
        const input = 'Here is the solution:\n\nYou need to update the handler:\n\n```typescript\nimport { Request, Response } from "express";\n\nexport async function handleRequest(req: Request, res: Response) {\n  const { id } = req.params;\n  const user = await db.users.findOne({ id });\n  if (!user) {\n    return res.status(404).json({ error: "User not found" });\n  }\n  return res.json({ success: true, data: user });\n}\n```\n\nThen update your routes:\n\n```typescript\nrouter.get("/users/:id", handleRequest);\n```\n\nLet me know if you need anything else!'
        const result = toTelegramMarkdown(input)
        // Code blocks should be preserved
        expect(result).toContain('import { Request, Response }')
        expect(result).toContain('db.users.findOne({ id })')
        expect(result).toContain('res.status(404)')
        expect(result).toContain('router.get("/users/:id"')
        // Text outside code blocks should have special chars escaped
        const outsideCode = result.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
        expect(outsideCode).not.toMatch(/(?<!\\)\./)
        expect(outsideCode).not.toMatch(/(?<!\\)!/)
    })

    // ── Arabic text ──

    it('should handle Arabic text with quoted block and period', () => {
        const input = '> "رئيس الولايات المتحدة هو *دونالد ترامب*، تولى منصبه في يناير 2025.\n>\n> إذا عندك أي سؤال، أنا هنا."'
        const result = toTelegramMarkdown(input)
        expect(result).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('دونالد ترامب')
        expect(result).toContain('2025')
    })

    it('should preserve Arabic text', () => {
        const result = toTelegramMarkdown('مرحبا كيف حالك؟')
        expect(result).toContain('مرحبا')
    })

    // ── Emoji ──

    it('should handle emoji in text', () => {
        const result = toTelegramMarkdown("Same answer — he's consistent. Just answers the question 😄")
        expect(result).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('😄')
    })

    // ── Numbered lists ──

    it('should handle numbered lists', () => {
        const input = '1. First item\n2. Second item\n3. Third item'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('First item')
        expect(result).toContain('Second item')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    // ── Complex payloads ──

    it('should handle the exact crashing payload', () => {
        const input = '*Claude Code says:*\n\n> "رئيس الولايات المتحدة الحالي هو *دونالد ترامب*، تولى منصبه في يناير 2025.\n>\n> إذا عندك أي سؤال برمجي أقدر أساعدك فيه، أنا هنا."\n\nSame answer — he\'s consistent. Just answers the question and ignores the attitude 😄\n\nWanna keep testing him or done?'
        const result = toTelegramMarkdown(input)
        const outsideCode = result.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
        expect(outsideCode).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('دونالد ترامب')
        expect(result).toContain('😄')
    })

    it('should handle message with heading, list, and code', () => {
        const input = '# Setup Guide\n\n1. Install dependencies:\n\n```bash\nnpm install\n```\n\n2. Configure the `.env` file.\n3. Run the app:\n\n```bash\nnpm start\n```\n\nDone!'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('npm install')
        expect(result).toContain('npm start')
        const outsideCode = result.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
        expect(outsideCode).not.toMatch(/(?<!\\)\./)
        expect(outsideCode).not.toMatch(/(?<!\\)!/)
    })

    it('should handle markdown table outside code block', () => {
        const input = '| Name | Value |\n|------|-------|\n| foo  | 1     |\n| bar  | 2     |'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('Name')
        expect(result).toContain('foo')
    })

    it('should handle horizontal rule', () => {
        const input = 'Before\n\n---\n\nAfter'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('Before')
        expect(result).toContain('After')
    })
})
