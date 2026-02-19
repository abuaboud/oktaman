# execute_bash

Executes bash commands in a local working directory (~/.oktaman/home/).

## When to Use

- Running shell commands and scripts
- Installing packages (apt, pip, npm, etc.)
- File operations and data transformations
- Testing automation scripts
- System administration tasks

## Best Practices

- Use appropriate flags for non-interactive execution (e.g., `-y` for apt)
- Chain dependent commands with `&&`
- Use absolute paths when necessary
- Consider timeouts for long-running commands
- Prefer single chained commands over multiple separate calls
- Test scripts before executing in production environments

## Parameters

- `command`: The bash command to execute
- `thought`: A short, friendly, non-technical message explaining what you are doing (e.g., "Installing dependencies", "Checking system status"). Keep it concise and user-friendly - this is displayed prominently in the UI as a preview for non-technical users.
