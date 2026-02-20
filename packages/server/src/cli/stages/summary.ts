import * as p from '@clack/prompts'
import { tryCatch } from '@oktaman/shared'
import { completeSetup } from '../api-client'
import type { SetupContext } from '../setup-context'

export async function completeSummary(ctx: SetupContext): Promise<void> {
    const { spinner, settings } = ctx

    spinner.start('Completing setup...')
    const [completeError, finalSettings] = await tryCatch(completeSetup())
    if (completeError) {
        spinner.stop('Warning: could not mark setup complete')
    } else {
        spinner.stop('Setup complete')
    }

    const summary = finalSettings ?? settings
    p.log.step('Configuration Summary')

    p.log.info(
        `  Provider:   ${summary.provider?.type ?? 'not set'}\n` +
        `  Chat model: ${summary.defaultModelId}\n` +
        `  Embedding:  ${summary.embeddingModelId}\n` +
        `  Firecrawl:  ${summary.firecrawlApiKey ? 'configured' : 'not set'}\n` +
        `  Composio:   ${summary.composioApiKey ? 'configured' : 'not set'}\n` +
        `  Telegram:   ${summary.channels.some((c: { type: string }) => c.type === 'TELEGRAM') ? 'connected' : 'not connected'}`
    )
}
