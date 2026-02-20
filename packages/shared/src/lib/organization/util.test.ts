import { describe, it, expect } from 'vitest'
import { conversationUtils, splitTextWithImages, resolveAttachmentUrl } from './util'
import { Conversation, UserConversationMessage, AssistantConversationMessage } from './conversation'
import type { AgentQuestion } from './question'

describe('conversationUtils', () => {
  describe('addUserMessage', () => {
    it('should add a simple text message', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addUserMessage({
        conversation,
        message: 'Hello world',
      })

      expect(result).toHaveLength(1)
      expect(result[0].role).toBe('user')
      const userMsg = result[0] as UserConversationMessage
      expect(userMsg.content).toHaveLength(1)
      expect(userMsg.content[0]).toEqual({
        type: 'text',
        message: 'Hello world',
      })
    })

    it('should skip empty message', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addUserMessage({
        conversation,
        message: '   ',
      })

      expect(result).toHaveLength(1)
      const userMsg = result[0] as UserConversationMessage
      expect(userMsg.content).toHaveLength(0)
    })

    it('should add trigger payload', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addUserMessage({
        conversation,
        message: 'Test',
        triggerPayload: {
          payload: { foo: 'bar' },
          triggerName: 'Test Trigger',
        },
      })

      const userMsg = result[0] as UserConversationMessage
      expect(userMsg.content).toHaveLength(2)
      expect(userMsg.content[1]).toEqual({
        type: 'trigger-payload',
        payload: { foo: 'bar' },
        triggerName: 'Test Trigger',
      })
    })

    it('should add image file', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addUserMessage({
        conversation,
        message: 'Test',
        files: [
          {
            name: 'test.png',
            type: 'image/png',
            url: 'https://example.com/test.png',
          },
        ],
      })

      const userMsg = result[0] as UserConversationMessage
      expect(userMsg.content).toHaveLength(2)
      expect(userMsg.content[1]).toEqual({
        type: 'image',
        image: 'https://example.com/test.png',
        name: 'test.png',
      })
    })

    it('should add PDF file', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addUserMessage({
        conversation,
        message: 'Test',
        files: [
          {
            name: 'doc.pdf',
            type: 'application/pdf',
            url: 'https://example.com/doc.pdf',
          },
        ],
      })

      const userMsg = result[0] as UserConversationMessage
      expect(userMsg.content).toHaveLength(2)
      expect(userMsg.content[1]).toEqual({
        type: 'file',
        file: 'https://example.com/doc.pdf',
        name: 'doc.pdf',
        mimeType: 'application/pdf',
      })
    })

    it('should add text file with content', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addUserMessage({
        conversation,
        message: 'Test',
        files: [
          {
            name: 'code.js',
            type: 'text/javascript',
            url: 'https://example.com/code.js',
            content: 'console.log("hello")',
          },
        ],
      })

      const userMsg = result[0] as UserConversationMessage
      expect(userMsg.content).toHaveLength(2)
      expect(userMsg.content[1].type).toBe('text')
      expect((userMsg.content[1] as any).message).toContain('code.js')
      expect((userMsg.content[1] as any).message).toContain('console.log("hello")')
    })

    it('should add instructions at the end', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addUserMessage({
        conversation,
        message: 'Test',
        instructions: 'Be concise',
      })

      const userMsg = result[0] as UserConversationMessage
      expect(userMsg.content).toHaveLength(2)
      expect(userMsg.content[1]).toEqual({
        type: 'instructions',
        instructions: 'Be concise',
      })
    })

    it('should preserve existing conversation', () => {
      const existingConversation: Conversation = [
        {
          role: 'user',
          content: [{ type: 'text', message: 'First message' }],
        },
      ]
      const result = conversationUtils.addUserMessage({
        conversation: existingConversation,
        message: 'Second message',
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(existingConversation[0])
    })
  })

  describe('addEmptyAssistantMessage', () => {
    it('should add empty assistant message', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addEmptyAssistantMessage(conversation)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        role: 'assistant',
        parts: [],
      })
    })
  })

  describe('streamChunk', () => {
    it('should create new assistant message if none exists', () => {
      const conversation: Conversation = []
      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: 'Hello',
          startedAt: '2024-01-01T00:00:00Z',
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].role).toBe('assistant')
      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(1)
      expect(assistantMsg.parts[0]).toEqual({
        type: 'text',
        message: 'Hello',
        startedAt: '2024-01-01T00:00:00Z',
      })
    })

    it('should append to existing text part', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [
            {
              type: 'text',
              message: 'Hello',
              startedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      ]

      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: ' world',
          startedAt: '2024-01-01T00:00:01Z',
        },
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(1)
      expect(assistantMsg.parts[0]).toEqual({
        type: 'text',
        message: 'Hello world',
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:00:01Z',
      })
    })

    it('should add new thinking part', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [],
        },
      ]

      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'thinking-delta',
          message: 'Let me think...',
          startedAt: '2024-01-01T00:00:00Z',
        },
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(1)
      expect(assistantMsg.parts[0].type).toBe('thinking')
      expect((assistantMsg.parts[0] as any).message).toBe('Let me think...')
    })

    it('should update tool call by toolCallId', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [
            {
              type: 'tool-call',
              toolName: 'search',
              toolCallId: 'call_123',
              status: 'loading',
            },
          ],
        },
      ]

      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'tool-call',
          toolName: 'search',
          toolCallId: 'call_123',
          status: 'completed',
          output: { results: ['foo', 'bar'] },
        },
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(1)
      expect((assistantMsg.parts[0] as any).status).toBe('completed')
      expect((assistantMsg.parts[0] as any).output).toEqual({ results: ['foo', 'bar'] })
    })

    it('should update cost', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [],
        },
      ]

      const result = conversationUtils.streamChunk(conversation, {
        cost: 0.05,
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.cost).toBe(0.05)
    })
  })

  describe('addCompactionMessage', () => {
    it('should add compaction message', () => {
      const conversation: Conversation = []
      const result = conversationUtils.addCompactionMessage(conversation, {
        role: 'compaction',
        summary: 'Previous messages summarized',
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        role: 'compaction',
        summary: 'Previous messages summarized',
      })
    })
  })

  describe('getQuestions', () => {
    it('should return empty array if no messages', () => {
      const conversation: Conversation = []
      const result = conversationUtils.getQuestions(conversation)
      expect(result).toEqual([])
    })

    it('should return empty array if last message is not assistant', () => {
      const conversation: Conversation = [
        {
          role: 'user',
          content: [{ type: 'text', message: 'Hello' }],
        },
      ]
      const result = conversationUtils.getQuestions(conversation)
      expect(result).toEqual([])
    })

    it('should return empty array if last part is not tool-call', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [{ type: 'text', message: 'Hello' }],
        },
      ]
      const result = conversationUtils.getQuestions(conversation)
      expect(result).toEqual([])
    })

    it('should extract questions from ask_question tool', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [
            {
              type: 'tool-call',
              toolName: 'ask_question',
              toolCallId: 'call_123',
              status: 'completed',
              input: {
                questions: [
                  {
                    text: 'What is your name?',
                    type: 'single_choice',
                    options: ['John', 'Jane'],
                  },
                ],
              },
            },
          ],
        },
      ]
      const result = conversationUtils.getQuestions(conversation)
      expect(result).toHaveLength(1)
      const question = result[0]
      expect(question.type).not.toBe('connection_card')
      if (question.type !== 'connection_card') {
        expect(question.text).toBe('What is your name?')
      }
    })

    it('should extract connection card questions from COMPOSIO_MANAGE_CONNECTIONS tool', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [
            {
              type: 'tool-call',
              toolName: 'COMPOSIO_MANAGE_CONNECTIONS',
              toolCallId: 'call_123',
              status: 'completed',
              input: {
                toolkits: ['slack'],
              },
              output: {
                data: {
                  results: {
                    slack: {
                      toolkit: 'slack',
                      status: 'initiated',
                      redirect_url: 'https://connect.composio.dev/link/lk_w18OBRDjZXbn',
                    },
                  },
                },
                error: null,
                successful: true,
              },
            },
            {
              type: 'text',
              message: 'Please connect your Slack account.',
            },
          ],
        },
      ]
      const result = conversationUtils.getQuestions(conversation)
      expect(result).toHaveLength(1)
      const question = result[0]
      expect(question.type).toBe('connection_card')
      if (question.type === 'connection_card') {
        expect(question.toolkit).toBe('slack')
        expect(question.redirectUrl).toBe('https://connect.composio.dev/link/lk_w18OBRDjZXbn')
        expect(question.connectionId).toBeUndefined()
        expect(question.name).toBe('slack')
      }
    })
    it('should filter out connections without redirect_url', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [
            {
              type: 'tool-call',
              toolName: 'COMPOSIO_MANAGE_CONNECTIONS',
              toolCallId: 'call_789',
              status: 'completed',
              output: {
                data: {
                  results: {
                    slack: {
                      toolkit: 'slack',
                      status: 'active',
                      connection_id: 'conn_456',
                    },
                    github: {
                      toolkit: 'github',
                      status: 'initiated',
                      redirect_url: 'https://composio.dev/auth/github/456',
                      connection_id: 'conn_789',
                    },
                  },
                },
                error: null,
                successful: true,
              },
            },
          ],
        },
      ]
      const result = conversationUtils.getQuestions(conversation)
      expect(result).toHaveLength(1)
      const question = result[0]
      expect(question.type).toBe('connection_card')
      if (question.type === 'connection_card') {
        expect(question.toolkit).toBe('github')
      }
    })
  })

  describe('splitTextWithImages', () => {
    it('should split text with a single image preserving order', () => {
      const result = splitTextWithImages('Here is a chart: ![chart](https://example.com/chart.png) and some text after')
      expect(result).toEqual([
        { type: 'text', message: 'Here is a chart: ' },
        { type: 'assistant-attachment', url: 'https://example.com/chart.png', altText: 'chart' },
        { type: 'text', message: ' and some text after' },
      ])
    })

    it('should split text with multiple images preserving order', () => {
      const result = splitTextWithImages('![a](https://a.png) text ![b](https://b.png)')
      expect(result).toEqual([
        { type: 'assistant-attachment', url: 'https://a.png', altText: 'a' },
        { type: 'text', message: ' text ' },
        { type: 'assistant-attachment', url: 'https://b.png', altText: 'b' },
      ])
    })

    it('should return single text part when no images present', () => {
      const result = splitTextWithImages('Just plain text')
      expect(result).toEqual([
        { type: 'text', message: 'Just plain text' },
      ])
    })

    it('should handle empty alt text', () => {
      const result = splitTextWithImages('![](https://example.com/img.png)')
      expect(result).toEqual([
        { type: 'assistant-attachment', url: 'https://example.com/img.png', altText: undefined },
      ])
    })

    it('should keep incomplete image patterns as text', () => {
      const result = splitTextWithImages('![alt](https://example.com/img')
      expect(result).toEqual([
        { type: 'text', message: '![alt](https://example.com/img' },
      ])
    })

    it('should not extract images inside fenced code blocks', () => {
      const text = 'Before\n```\n![img](https://example.com/img.png)\n```\nAfter'
      const result = splitTextWithImages(text)
      expect(result).toEqual([
        { type: 'text', message: text },
      ])
    })

    it('should not extract images inside inline code', () => {
      const text = 'Use `![img](https://example.com/img.png)` to embed'
      const result = splitTextWithImages(text)
      expect(result).toEqual([
        { type: 'text', message: text },
      ])
    })

    it('should extract images outside code blocks but keep ones inside as text', () => {
      const result = splitTextWithImages('![outside](https://outside.png)\n```\n![inside](https://inside.png)\n```\n![also-outside](https://also.png)')
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ type: 'assistant-attachment', url: 'https://outside.png', altText: 'outside' })
      expect(result[1]).toEqual({ type: 'text', message: '\n```\n![inside](https://inside.png)\n```\n' })
      expect(result[2]).toEqual({ type: 'assistant-attachment', url: 'https://also.png', altText: 'also-outside' })
    })

    it('should not extract images inside unclosed fenced code blocks', () => {
      const text = 'Before\n```\n![img](https://example.com/img.png)\nmore code'
      const result = splitTextWithImages(text)
      expect(result).toEqual([
        { type: 'text', message: text },
      ])
    })

    it('should not extract images inside code blocks with language tag', () => {
      const text = '```markdown\n![img](https://example.com/img.png)\n```'
      const result = splitTextWithImages(text)
      expect(result).toEqual([
        { type: 'text', message: text },
      ])
    })

    it('should return empty array for empty string', () => {
      const result = splitTextWithImages('')
      expect(result).toEqual([])
    })

    it('should preserve text between consecutive images', () => {
      const result = splitTextWithImages('![a](https://a.png)between![b](https://b.png)')
      expect(result).toEqual([
        { type: 'assistant-attachment', url: 'https://a.png', altText: 'a' },
        { type: 'text', message: 'between' },
        { type: 'assistant-attachment', url: 'https://b.png', altText: 'b' },
      ])
    })

    it('should resolve local file paths in image URLs', () => {
      const result = splitTextWithImages('![chart](/home/user/chart.png)')
      expect(result).toEqual([
        { type: 'assistant-attachment', url: '/api/v1/attachments/view?path=%2Fhome%2Fuser%2Fchart.png', altText: 'chart' },
      ])
    })
  })

  describe('resolveAttachmentUrl', () => {
    it('should return http URLs as-is', () => {
      expect(resolveAttachmentUrl('http://example.com/img.png')).toBe('http://example.com/img.png')
    })

    it('should return https URLs as-is', () => {
      expect(resolveAttachmentUrl('https://example.com/img.png')).toBe('https://example.com/img.png')
    })

    it('should return /v1/ paths as-is', () => {
      expect(resolveAttachmentUrl('/v1/files/abc/img.png')).toBe('/v1/files/abc/img.png')
    })

    it('should return /api/ paths as-is', () => {
      expect(resolveAttachmentUrl('/api/v1/files/abc/img.png')).toBe('/api/v1/files/abc/img.png')
    })

    it('should wrap local file paths with controller URL', () => {
      expect(resolveAttachmentUrl('/home/user/chart.png')).toBe('/api/v1/attachments/view?path=%2Fhome%2Fuser%2Fchart.png')
    })

    it('should encode special characters in local paths', () => {
      expect(resolveAttachmentUrl('/tmp/my file (1).png')).toBe('/api/v1/attachments/view?path=%2Ftmp%2Fmy%20file%20(1).png')
    })

    it('should wrap relative paths with controller URL', () => {
      expect(resolveAttachmentUrl('images/chart.png')).toBe('/api/v1/attachments/view?path=images%2Fchart.png')
    })
  })

  describe('streamChunk image extraction', () => {
    it('should split image from text preserving order in parts', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [
            {
              type: 'text',
              message: 'Here is a chart: ![chart](https://example.com/chart.png)',
              startedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      ]

      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: ' done',
          startedAt: '2024-01-01T00:00:01Z',
        },
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      // Order: text before image, attachment, text after image
      expect(assistantMsg.parts).toHaveLength(3)
      expect(assistantMsg.parts[0].type).toBe('text')
      if (assistantMsg.parts[0].type === 'text') {
        expect(assistantMsg.parts[0].message).toBe('Here is a chart: ')
      }
      expect(assistantMsg.parts[1].type).toBe('assistant-attachment')
      if (assistantMsg.parts[1].type === 'assistant-attachment') {
        expect(assistantMsg.parts[1].url).toBe('https://example.com/chart.png')
        expect(assistantMsg.parts[1].altText).toBe('chart')
      }
      expect(assistantMsg.parts[2].type).toBe('text')
      if (assistantMsg.parts[2].type === 'text') {
        expect(assistantMsg.parts[2].message).toBe(' done')
      }
    })

    it('should produce only attachment part when text is just an image', () => {
      const conversation: Conversation = []

      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: '![img](https://example.com/img.png)',
          startedAt: '2024-01-01T00:00:00Z',
        },
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(1)
      expect(assistantMsg.parts[0].type).toBe('assistant-attachment')
      if (assistantMsg.parts[0].type === 'assistant-attachment') {
        expect(assistantMsg.parts[0].url).toBe('https://example.com/img.png')
      }
    })

    it('should handle incomplete image pattern across multiple chunks', () => {
      let conversation: Conversation = []

      // First chunk: partial image markdown
      conversation = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: '![alt](https://example.com/img',
          startedAt: '2024-01-01T00:00:00Z',
        },
      })

      let assistantMsg = conversation[0] as AssistantConversationMessage
      // Should still be text since pattern is incomplete
      expect(assistantMsg.parts).toHaveLength(1)
      expect(assistantMsg.parts[0].type).toBe('text')

      // Second chunk: completes the pattern
      conversation = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: '.png)',
          startedAt: '2024-01-01T00:00:01Z',
        },
      })

      assistantMsg = conversation[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(1)
      expect(assistantMsg.parts[0].type).toBe('assistant-attachment')
      if (assistantMsg.parts[0].type === 'assistant-attachment') {
        expect(assistantMsg.parts[0].url).toBe('https://example.com/img.png')
        expect(assistantMsg.parts[0].altText).toBe('alt')
      }
    })

    it('should preserve order with multiple images interleaved with text', () => {
      const conversation: Conversation = [
        {
          role: 'assistant',
          parts: [
            {
              type: 'text',
              message: '![a](https://a.png) middle ![b](https://b.png)',
              startedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      ]

      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: ' end',
          startedAt: '2024-01-01T00:00:01Z',
        },
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(4)
      expect(assistantMsg.parts[0].type).toBe('assistant-attachment')
      expect(assistantMsg.parts[1].type).toBe('text')
      expect(assistantMsg.parts[2].type).toBe('assistant-attachment')
      expect(assistantMsg.parts[3].type).toBe('text')
      if (assistantMsg.parts[3].type === 'text') {
        expect(assistantMsg.parts[3].message).toBe(' end')
      }
    })

    it('should not extract images inside code blocks in streamed text', () => {
      const conversation: Conversation = []

      const result = conversationUtils.streamChunk(conversation, {
        part: {
          type: 'text-delta',
          message: '```\n![img](https://example.com/img.png)\n```',
          startedAt: '2024-01-01T00:00:00Z',
        },
      })

      const assistantMsg = result[0] as AssistantConversationMessage
      expect(assistantMsg.parts).toHaveLength(1)
      expect(assistantMsg.parts[0].type).toBe('text')
    })
  })
})
