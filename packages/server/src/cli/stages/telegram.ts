import * as p from '@clack/prompts'
import { tryCatch } from '@oktaman/shared'
import { addChannel, generatePairingCode } from '../api-client'
import { handleCancel, padRight } from '../setup-context'
import type { SetupContext } from '../setup-context'

export async function configureTelegram(ctx: SetupContext): Promise<void> {
    const { spinner, settings } = ctx
    const hasTelegram = settings.channels.some((c: { type: string }) => c.type === 'TELEGRAM')

    let shouldConfigure = false

    if (hasTelegram) {
        const skip = await p.confirm({
            message: 'Telegram bot is already connected. Skip?',
            initialValue: true,
        })
        if (p.isCancel(skip)) return handleCancel()
        shouldConfigure = !skip
    } else {
        const addTg = await p.confirm({
            message: 'Connect a Telegram bot?',
            initialValue: false,
        })
        if (p.isCancel(addTg)) return handleCancel()
        shouldConfigure = addTg
    }

    if (!shouldConfigure) return

    p.log.step('Stage 3: Telegram')
    p.log.info(
        'How to create a Telegram bot:\n' +
        '  1. Open Telegram and search for @BotFather\n' +
        '  2. Send /newbot and follow the prompts\n' +
        '  3. Copy the bot token provided'
    )

    const botToken = await p.password({
        message: 'Enter your Telegram bot token',
        validate: (val) => {
            if (!val || val.trim() === '') return 'Bot token is required'
            return undefined
        },
    })
    if (p.isCancel(botToken)) return handleCancel()

    spinner.start('Verifying and connecting Telegram bot...')
    const [channelError, channel] = await tryCatch(
        addChannel({
            name: 'Telegram Bot',
            type: 'TELEGRAM',
            config: { botToken, pairedChatId: null },
        })
    )
    if (channelError) {
        spinner.stop('Failed to connect')
        p.log.error(`Failed to connect Telegram: ${channelError.message}`)
        return
    }

    spinner.stop('Telegram bot connected')

    // Generate pairing code
    spinner.start('Generating pairing code...')
    const [pairingError, pairing] = await tryCatch(
        generatePairingCode(channel.id)
    )
    if (pairingError) {
        spinner.stop('Failed to generate code')
        p.log.warn('Bot connected but pairing code failed. Generate one from the UI.')
        return
    }

    spinner.stop('Pairing code ready')
    const code = pairing.code.toLowerCase()
    const boxLine = '╔══════════════════════════════════════════════╗'
    const boxEnd  = '╚══════════════════════════════════════════════╝'
    p.log.message(
        '\n' +
        `  ${boxLine}\n` +
        `  ║                                              ║\n` +
        `  ║   Your pairing code:   ${padRight(code, 23)}║\n` +
        `  ║                                              ║\n` +
        `  ║   Send this code to your Telegram bot.       ║\n` +
        `  ║   The code expires in 10 minutes.            ║\n` +
        `  ║                                              ║\n` +
        `  ${boxEnd}\n`
    )
}
