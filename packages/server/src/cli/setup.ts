import * as p from '@clack/prompts'
import { tryCatch } from '@oktaman/shared'
import { checkHealth, getSettings } from './api-client'
import { configureProvider } from './stages/provider'
import { configureTools } from './stages/tools'
import { configureTelegram } from './stages/telegram'
import { completeSummary } from './stages/summary'

export async function main() {
    p.intro('OktaMan Setup')

    const spinner = p.spinner()
    spinner.start('Checking if OktaMan is running...')
    const healthy = await checkHealth()
    if (!healthy) {
        spinner.stop('OktaMan is not running')
        p.log.error('Could not connect to OktaMan server.')
        p.log.info('Start it first with: oktaman start')
        p.outro('Setup cancelled')
        process.exit(1)
        return
    }
    spinner.stop('OktaMan is running')

    const [settingsError, settings] = await tryCatch(getSettings())
    if (settingsError) {
        p.log.error(`Failed to fetch settings: ${settingsError.message}`)
        p.outro('Setup cancelled')
        process.exit(1)
        return
    }

    const ctx = { spinner, settings }

    await configureProvider(ctx)
    await configureTools(ctx)
    await configureTelegram(ctx)
    await completeSummary(ctx)

    p.outro('Run "oktaman open" to launch the web UI')
}
