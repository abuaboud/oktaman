import { describe, it, expect } from 'vitest'
import { conversationUtils } from './util'
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
      expect(result[0].sentAt).toBeDefined()
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
})
