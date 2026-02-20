import * as p from '@clack/prompts'
import type { Settings } from './api-client'

export function handleCancel(): void {
    p.cancel('Setup cancelled')
    process.exit(0)
}

export function padRight(text: string, width: number): string {
    return text + ' '.repeat(Math.max(0, width - text.length))
}

export type SetupContext = {
    spinner: ReturnType<typeof p.spinner>
    settings: Settings
}
