import * as p from '@clack/prompts'
import { tryCatch } from '@oktaman/shared'
import { updateToolsSettings } from '../api-client'
import { handleCancel } from '../setup-context'
import type { SetupContext } from '../setup-context'

export async function configureTools(ctx: SetupContext): Promise<void> {
    const { spinner, settings } = ctx
    const hasToolsConfig = !!(settings.firecrawlApiKey || settings.composioApiKey)

    let configureToolsPrompt = 'Configure web scraping & integrations?'
    if (hasToolsConfig) {
        configureToolsPrompt = 'Tools are already configured. Reconfigure?'
    }

    const shouldConfigure = await p.confirm({
        message: configureToolsPrompt,
        initialValue: !hasToolsConfig,
    })
    if (p.isCancel(shouldConfigure)) return handleCancel()

    if (!shouldConfigure) return

    p.log.step('Stage 2: Tools')

    // ── Firecrawl ──
    p.log.info(
        'Firecrawl lets OktaMan scrape and read web pages during conversations.\n' +
        '  Get a free API key at firecrawl.dev (500 credits included).'
    )
    const firecrawlKey = await p.password({
        message: 'Firecrawl API key (press Enter to skip)',
    })
    if (p.isCancel(firecrawlKey)) return handleCancel()

    // ── Composio ──
    p.log.info(
        'Composio connects OktaMan to external apps (Gmail, Slack, GitHub, etc.).\n' +
        '  It has two parts:\n' +
        '    1. Tools   — lets the agent take actions (send emails, create issues, etc.)\n' +
        '                 Requires an API key.\n' +
        '    2. Triggers — lets external apps notify OktaMan when something happens\n' +
        '                  (e.g. new email, new PR). Requires a webhook URL + secret.\n' +
        '  Get both at app.composio.dev/settings'
    )
    const composioKey = await p.password({
        message: 'Composio API key — needed for tools (press Enter to skip)',
    })
    if (p.isCancel(composioKey)) return handleCancel()

    let composioWebhookSecret = ''
    if (composioKey) {
        p.log.info(
            'The webhook secret verifies that incoming trigger events are from Composio.\n' +
            '  You also need to paste OktaMan\'s webhook URL into Composio\'s settings.'
        )
        const webhookResult = await p.password({
            message: 'Composio webhook secret — needed for triggers (press Enter to skip)',
        })
        if (p.isCancel(webhookResult)) return handleCancel()
        composioWebhookSecret = webhookResult || ''
    }

    spinner.start('Saving tools settings...')
    const [toolsError] = await tryCatch(
        updateToolsSettings({
            ...(firecrawlKey ? { firecrawlApiKey: firecrawlKey } : {}),
            ...(composioKey ? { composioApiKey: composioKey } : {}),
            ...(composioWebhookSecret ? { composioWebhookSecret } : {}),
        })
    )
    if (toolsError) {
        spinner.stop('Failed to save')
        p.log.error(`Failed to save tools settings: ${toolsError.message}`)
    } else {
        spinner.stop('Tools settings saved')
    }
}
