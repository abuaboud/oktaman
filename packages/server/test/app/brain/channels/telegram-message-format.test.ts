import { describe, it, expect } from 'vitest'
import telegramifyMarkdown from 'telegramify-markdown'

const STRATEGY = 'escape'

describe('telegramifyMarkdown with escape strategy', () => {
    it('should preserve text in double quotes', () => {
        const input = 'He said "hello world" to everyone.'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('hello world')
    })

    it('should preserve a full quoted sentence', () => {
        const input = '"As of my knowledge cutoff in May 2025, Donald Trump is the President of the United States."'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('Donald Trump is the President')
    })

    it('should preserve bold text', () => {
        const input = 'This is **bold** text.'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('bold')
    })

    it('should preserve inline code', () => {
        const input = 'Run `npm install` to install.'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('npm install')
    })

    it('should preserve blockquote content', () => {
        const input = '> This is a blockquote'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('This is a blockquote')
    })

    it('should preserve link text', () => {
        const input = 'Visit [Google](https://google.com) for more info.'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('Google')
    })

    it('should preserve numbered list items', () => {
        const input = '1. First item\n2. Second item\n3. Third item'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('First item')
        expect(result).toContain('Second item')
        expect(result).toContain('Third item')
    })

    it('should preserve code block content', () => {
        const input = '```\nconst x = 1;\n```'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('const x = 1')
    })

    it('should not produce empty output for normal text', () => {
        const input = 'Hello, how are you today?'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result.trim().length).toBeGreaterThan(0)
    })

    it('should preserve special characters in text', () => {
        const input = 'Price is $10.99 + tax (20%).'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('10')
        expect(result).toContain('tax')
    })

    it('should preserve Arabic text', () => {
        const input = 'مرحبا كيف حالك؟'
        const result = telegramifyMarkdown(input, STRATEGY)
        expect(result).toContain('مرحبا')
    })
})

describe('telegramifyMarkdown remove vs escape comparison', () => {
    it('remove strategy strips blockquote content, escape preserves it', () => {
        const input = '> Important note here'
        const removed = telegramifyMarkdown(input, 'remove')
        const escaped = telegramifyMarkdown(input, 'escape')
        expect(escaped).toContain('Important note here')
        // remove strategy may strip the content entirely
        if (!removed.includes('Important note here')) {
            expect(escaped.length).toBeGreaterThan(removed.length)
        }
    })

    it('remove strategy may strip quoted text, escape preserves it', () => {
        const input = 'He said "hello world" to everyone.'
        const escaped = telegramifyMarkdown(input, 'escape')
        expect(escaped).toContain('hello world')
    })
})
