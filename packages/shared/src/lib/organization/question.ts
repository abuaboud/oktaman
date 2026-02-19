import { z } from "zod"

export enum QuestionType {
    SINGLE_CHOICE = "single_choice",
    MULTIPLE_CHOICE = "multiple_choice",
    CONNECTION_CARD = "connection_card",
    TEXT_FIELD = "text_field"
}

export const ConnectionQuestion = z.object({
    toolkit: z.string().describe("The toolkit/integration slug"),
    name: z.string().optional().describe("Display name for the toolkit"),
    type: z.literal('connection_card'),
    redirectUrl: z.string().describe("The URL to redirect for authentication"),
    connectionId: z.string().optional().describe("The connection ID to check status"),
})
export type ConnectionQuestion = z.infer<typeof ConnectionQuestion>

export const AgentSingleQuestion = z.object({
    text: z.string().describe('Clear, concise question text'),
    type: z.enum(['single_choice', 'multiple_choice']).describe('Type of question'),
    options: z.array(z.string()).min(2).describe('At least 2 predefined options'),
})

export type AgentSingleQuestion = z.infer<typeof AgentSingleQuestion>

export const AgentTextFieldQuestion = z.object({
    text: z.string().describe('Clear, concise question text'),
    type: z.literal('text_field').describe('Text field question type'),
    placeholder: z.string().optional().describe('Placeholder text for the input'),
    multiline: z.boolean().optional().describe('Whether to use textarea instead of input'),
})

export type AgentTextFieldQuestion = z.infer<typeof AgentTextFieldQuestion>

export const AgentQuestion = z.union([AgentSingleQuestion, AgentTextFieldQuestion, ConnectionQuestion])
export type AgentQuestion = z.infer<typeof AgentQuestion>

export const AskQuestionInput = z.object({
    questions: z.array(AgentQuestion).min(1).max(5).describe('1-5 questions to ask'),
})
export type AskQuestionInput = z.infer<typeof AskQuestionInput>

export const QuestionAnswer = z.object({
    selectedOptions: z.array(z.string()).default([]).describe("Selected option values"),
    customInput: z.string().optional().describe("Custom text input"),
    answeredAt: z.coerce.date(),
})
export type QuestionAnswer = z.infer<typeof QuestionAnswer>
