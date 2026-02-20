import { describe, it, expect } from 'vitest'
import { toTelegramMarkdown } from '../../../../src/app/brain/channels/telegram-channel-handler'

describe('toTelegramMarkdown – MarkdownV2 safety', () => {
    it('should escape dots in plain text', () => {
        const result = toTelegramMarkdown('Smart move. Keep it clean.')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should escape dots after backslash-period combos from original markdown', () => {
        const input = 'He took office in January 2025.\n\nWanna keep testing?'
        const result = toTelegramMarkdown(input)
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should handle Arabic text with quoted block and period', () => {
        const input = '> "رئيس الولايات المتحدة هو *دونالد ترامب*، تولى منصبه في يناير 2025.\n>\n> إذا عندك أي سؤال، أنا هنا."'
        const result = toTelegramMarkdown(input)
        expect(result).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('دونالد ترامب')
        expect(result).toContain('2025')
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

    it('should not double-escape already escaped characters', () => {
        const result = toTelegramMarkdown('Hello world.')
        expect(result).toContain('\\.')
        expect(result).not.toContain('\\\\.')
    })

    it('should not escape characters inside code blocks', () => {
        const input = '```\nconst x = 1.5 + 2;\n```'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('const x = 1.5 + 2')
    })

    it('should not escape characters inside inline code', () => {
        const input = 'Run `npm install --save`'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('npm install --save')
    })

    it('should preserve bold formatting', () => {
        const result = toTelegramMarkdown('This is **bold** text.')
        expect(result).toContain('*bold*')
    })

    it('should preserve link formatting', () => {
        const result = toTelegramMarkdown('Visit [Google](https://google.com) now.')
        expect(result).toContain('[Google]')
        expect(result).toContain('google')
    })

    it('should handle emoji in text', () => {
        const result = toTelegramMarkdown("Same answer — he's consistent. Just answers the question 😄")
        expect(result).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('😄')
    })

    it('should handle the exact crashing payload', () => {
        const input = '*Claude Code says:*\n\n> "رئيس الولايات المتحدة الحالي هو *دونالد ترامب*، تولى منصبه في يناير 2025.\n>\n> إذا عندك أي سؤال برمجي أقدر أساعدك فيه، أنا هنا."\n\nSame answer — he\'s consistent. Just answers the question and ignores the attitude 😄\n\nWanna keep testing him or done?'
        const result = toTelegramMarkdown(input)
        const outsideCode = result.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
        expect(outsideCode).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('دونالد ترامب')
        expect(result).toContain('😄')
    })

    it('should preserve Arabic text', () => {
        const result = toTelegramMarkdown('مرحبا كيف حالك؟')
        expect(result).toContain('مرحبا')
    })

    it('should handle numbered lists', () => {
        const input = '1. First item\n2. Second item\n3. Third item'
        const result = toTelegramMarkdown(input)
        expect(result).toContain('First item')
        expect(result).toContain('Second item')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should not produce empty output', () => {
        const result = toTelegramMarkdown('Hello, how are you?')
        expect(result.trim().length).toBeGreaterThan(0)
    })

    it('should handle parentheses in text', () => {
        const result = toTelegramMarkdown('Price is $10 (with tax).')
        expect(result).toContain('with tax')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should handle dashes in plain text', () => {
        const result = toTelegramMarkdown('First item - second item')
        expect(result).toContain('First item')
        expect(result).toContain('second item')
    })
})
