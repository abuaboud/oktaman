import { describe, it, expect } from 'vitest'
import telegramifyMarkdown from 'telegramify-markdown'

/**
 * Characters that are reserved in MarkdownV2 but are NEVER part of formatting
 * syntax. These are always safe to escape without breaking bold/italic/links/etc.
 */
const SAFE_TO_ESCAPE = /(?<!\\)[.!#+=|{}]/g

/**
 * Mirrors the production helper: run telegramifyMarkdown then patch any
 * leftover un-escaped non-formatting reserved chars.
 */
function toTelegram(markdown: string): string {
    const converted = telegramifyMarkdown(markdown, 'escape')
    return fixUnescapedChars(converted)
}

/**
 * Escape MarkdownV2 reserved characters that the library missed,
 * but only the ones that are never part of formatting syntax.
 * Skips code blocks and inline code.
 */
function fixUnescapedChars(text: string): string {
    const CODE_BLOCK = /```[\s\S]*?```/g
    const INLINE_CODE = /`[^`]+`/g

    // Collect ranges we must not touch
    const protectedRanges: [number, number][] = []
    for (const regex of [CODE_BLOCK, INLINE_CODE]) {
        let m: RegExpExecArray | null
        regex.lastIndex = 0
        while ((m = regex.exec(text)) !== null) {
            protectedRanges.push([m.index, m.index + m[0].length])
        }
    }

    function isProtected(idx: number): boolean {
        return protectedRanges.some(([s, e]) => idx >= s && idx < e)
    }

    let result = ''
    for (let i = 0; i < text.length; i++) {
        if (isProtected(i)) {
            result += text[i]
            continue
        }
        // Already escaped → keep as-is
        if (text[i] === '\\' && i + 1 < text.length) {
            result += text[i] + text[i + 1]
            i++
            continue
        }
        SAFE_TO_ESCAPE.lastIndex = 0
        if (SAFE_TO_ESCAPE.test(text[i])) {
            result += '\\' + text[i]
        } else {
            result += text[i]
        }
    }
    return result
}

describe('toTelegram – MarkdownV2 safety', () => {
    it('should escape dots in plain text', () => {
        const result = toTelegram('Smart move. Keep it clean.')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should escape dots after backslash-period combos from original markdown', () => {
        const input = 'He took office in January 2025.\n\nWanna keep testing?'
        const result = toTelegram(input)
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should handle Arabic text with quoted block and period', () => {
        const input = '> "رئيس الولايات المتحدة هو *دونالد ترامب*، تولى منصبه في يناير 2025.\n>\n> إذا عندك أي سؤال، أنا هنا."'
        const result = toTelegram(input)
        expect(result).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('دونالد ترامب')
        expect(result).toContain('2025')
    })

    it('should escape exclamation marks', () => {
        const result = toTelegram('Hello! How are you!')
        expect(result).not.toMatch(/(?<!\\)!/)
    })

    it('should escape plus and equals signs', () => {
        const result = toTelegram('2 + 2 = 4')
        expect(result).not.toMatch(/(?<!\\)\+/)
        expect(result).not.toMatch(/(?<!\\)=/)
    })

    it('should not double-escape already escaped characters', () => {
        const result = toTelegram('Hello world.')
        expect(result).toContain('\\.')
        expect(result).not.toContain('\\\\.')
    })

    it('should not escape characters inside code blocks', () => {
        const input = '```\nconst x = 1.5 + 2;\n```'
        const result = toTelegram(input)
        expect(result).toContain('const x = 1.5 + 2')
    })

    it('should not escape characters inside inline code', () => {
        const input = 'Run `npm install --save`'
        const result = toTelegram(input)
        expect(result).toContain('npm install --save')
    })

    it('should preserve bold formatting', () => {
        const result = toTelegram('This is **bold** text.')
        expect(result).toContain('*bold*')
    })

    it('should preserve link formatting', () => {
        const result = toTelegram('Visit [Google](https://google.com) now.')
        expect(result).toContain('[Google]')
        expect(result).toContain('google')
    })

    it('should handle emoji in text', () => {
        const result = toTelegram("Same answer — he's consistent. Just answers the question 😄")
        expect(result).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('😄')
    })

    it('should handle the exact crashing payload', () => {
        const input = '*Claude Code says:*\n\n> "رئيس الولايات المتحدة الحالي هو *دونالد ترامب*، تولى منصبه في يناير 2025.\n>\n> إذا عندك أي سؤال برمجي أقدر أساعدك فيه، أنا هنا."\n\nSame answer — he\'s consistent. Just answers the question and ignores the attitude 😄\n\nWanna keep testing him or done?'
        const result = toTelegram(input)
        const outsideCode = result.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
        expect(outsideCode).not.toMatch(/(?<!\\)\./)
        expect(result).toContain('دونالد ترامب')
        expect(result).toContain('😄')
    })

    it('should preserve Arabic text', () => {
        const result = toTelegram('مرحبا كيف حالك؟')
        expect(result).toContain('مرحبا')
    })

    it('should handle numbered lists', () => {
        const input = '1. First item\n2. Second item\n3. Third item'
        const result = toTelegram(input)
        expect(result).toContain('First item')
        expect(result).toContain('Second item')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should not produce empty output', () => {
        const result = toTelegram('Hello, how are you?')
        expect(result.trim().length).toBeGreaterThan(0)
    })

    it('should handle parentheses in text', () => {
        // Parentheses are part of link syntax so the library handles them;
        // we just verify content is preserved
        const result = toTelegram('Price is $10 (with tax).')
        expect(result).toContain('with tax')
        expect(result).not.toMatch(/(?<!\\)\./)
    })

    it('should handle dashes in plain text', () => {
        const result = toTelegram('First item - second item')
        expect(result).toContain('First item')
        expect(result).toContain('second item')
    })
})
