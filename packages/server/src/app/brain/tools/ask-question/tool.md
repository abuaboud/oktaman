# ask_question

Ask users structured questions with predefined options. Never ask questions in plain text—always use this tool.

## When to Use

- User confirmation or decisions needed
- Gathering preferences or choices
- Clarifying vague requirements
- Presenting next-step options
- Before creating agents or making significant changes

## Best Practices

- **Ask sparingly**: Only when truly necessary for critical decisions—prefer reasonable defaults
- **Keep it minimal**: Ask 1-2 questions per interaction (maximum 5)
- **Be concise**: Short, clear question text—avoid lengthy explanations
- **Stop immediately**: NEVER continue execution after calling—wait for user response
- **Provide options**: At least 2 meaningful options per question
- **Choose correct type**: single_choice for exclusive options, multiple_choice for multi-select
- Each question automatically includes a custom text input field

## Parameters

- `questions`: Array of question objects, each with:
  - `text`: Clear, concise question
  - `type`: Either "single_choice" or "multiple_choice"
  - `options`: Array of at least 2 options with `label` and `value`
  - `required`: Boolean (defaults to true)

## Important Notes

- The session pauses until the user responds
- Never continue execution after calling this tool
- Users can always provide custom text input beyond predefined options
