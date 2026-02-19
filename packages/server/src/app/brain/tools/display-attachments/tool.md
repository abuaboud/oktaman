# display_attachments

Shows files and images to the user.

## When to Use

- After creating visual output (charts, images, PDFs)
- When displaying external URLs (images, documents, resources)
- Any time the user asks for files, explicitly or implicitly
- When providing downloadable content

## Best Practices

- Use immediately after generating visual content
- Provide descriptive names for all attachments
- Use relative paths from the working directory or absolute paths
- Ensure URLs are publicly accessible
- Group related attachments in a single call
- Always use this tool instead of describing the file location

## Parameters

- `attachments`: Array of attachment objects with:
  - `name`: Descriptive filename
  - `path` or `url`: Location of the file
