import { AskQuestionInput } from '@oktaman/shared'
import { Tool, tool } from 'ai'
import { z } from 'zod'

export const ASK_QUESTION_TOOL_NAME = 'ask_question'

const description = `
Ask the user one or more questions to gather information.

Use this tool when you need:
- User confirmation or decision making
- To gather specific information with multiple choices
- To understand user preferences
- To collect free-form text input

Question Types:
1. Single Choice: One option selected from predefined choices (includes "Other" for custom input)
2. Multiple Choice: Multiple options selected from predefined choices
3. Text Field: Free-form text input (supports single-line or multiline)

Each question with choices includes:
- Clear question text
- At least 2 predefined options
- An "Other" custom input field (automatically available)

Text field questions include:
- Clear question text
- Optional placeholder text
- Optional multiline support for longer responses

Maximum 5 questions per tool call.
`


export function createAskQuestionTool(_sessionId: string): Record<string, Tool> {
    return {
        [ASK_QUESTION_TOOL_NAME]: tool({
            description,
            inputSchema: AskQuestionInput.strict(),
            execute: async ({ questions }) => {
                return {
                    success: true,
                    message: `Waiting for user response.`,
                }
            },
        }),
    }
}
