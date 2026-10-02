import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Verify Telegram webhook secret token
function verifySecretToken(request: NextRequest): boolean {
  const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET

  if (!expectedToken) {
    console.error('[telegram/webhook] TELEGRAM_WEBHOOK_SECRET is not configured')
    return false
  }

  return secretToken === expectedToken
}

// Send a message to a Telegram chat
async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN is not configured')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[telegram] Failed to send message: ${data.description}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[telegram] Error sending message:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  console.log('[telegram/webhook] ============ WEBHOOK INVOKED ============')

  try {
    // Verify secret token
    if (!verifySecretToken(request)) {
      console.warn('[telegram/webhook] ❌ Invalid or missing secret token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[telegram/webhook] ✅ Secret token verified')

    // Parse update payload
    let update: any
    try {
      update = await request.json()
      console.log('[telegram/webhook] Received update:', JSON.stringify(update, null, 2))
    } catch (error) {
      console.error('[telegram/webhook] ❌ Failed to parse JSON:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Handle message update
    if (update.message) {
      const { message } = update
      console.log('[telegram/webhook] Processing message from chat:', message.chat.id)
      console.log('[telegram/webhook] Message text:', message.text)

      // Handle /start command with payload
      if (message.text && message.text.startsWith('/start')) {
        const payload = message.text.split(' ')[1]
        console.log('[telegram/webhook] /start command detected, payload:', payload || '(none)')

        if (payload) {
          await handleStartCommand(message.chat.id.toString(), payload)
        } else {
          // No payload - send help message
          await sendTelegramMessage(
            message.chat.id.toString(),
            'Welcome to Hostlink! Please connect your account by visiting Settings in Hostlink.'
          )
        }
      } else {
        // Handle other messages
        await sendTelegramMessage(
          message.chat.id.toString(),
          'Welcome to Hostlink Notifications! To connect your account, visit Settings in Hostlink and click "Connect Telegram".'
        )
      }
    } else {
      console.log('[telegram/webhook] No message in update')
    }

    console.log('[telegram/webhook] ✅ Webhook processed successfully')
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[telegram/webhook] ❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleStartCommand(chatId: string, token: string) {
  console.log(`[telegram/webhook/start] ============ HANDLING /start ============`)
  console.log(`[telegram/webhook/start] Chat ID: ${chatId}`)
  console.log(`[telegram/webhook/start] Token: ${token}`)

  try {
    // Find user by link token
    console.log('[telegram/webhook/start] Looking up user by token...')
    const user = await prisma.user.findFirst({
      where: {
        telegramLinkToken: token,
        telegramLinkTokenExpiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      console.log('[telegram/webhook/start] ❌ No user found with valid token')

      // Check if token exists but is expired
      const expiredUser = await prisma.user.findFirst({
        where: { telegramLinkToken: token },
      })

      if (expiredUser) {
        console.log('[telegram/webhook/start] Token exists but expired for user:', expiredUser.id)
        console.log('[telegram/webhook/start] Token expired at:', expiredUser.telegramLinkTokenExpiresAt)
      } else {
        console.log('[telegram/webhook/start] Token does not exist in database at all')
      }

      // Invalid or expired token
      await sendTelegramMessage(
        chatId,
        '❌ Invalid or expired linking token. Please go back to Hostlink and try connecting your account again.'
      )
      return
    }

    console.log('[telegram/webhook/start] ✅ User found:', user.id, user.email)
    console.log('[telegram/webhook/start] Token expires at:', user.telegramLinkTokenExpiresAt)

    // Update user with chat ID and clear token
    console.log('[telegram/webhook/start] Updating user with chat ID...')
    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: chatId,
        telegramLinkToken: null,
        telegramLinkTokenExpiresAt: null,
      },
    })

    console.log('[telegram/webhook/start] ✅ User updated successfully')

    // Send success message
    console.log('[telegram/webhook/start] Sending success message...')
    const sent = await sendTelegramMessage(
      chatId,
      `✅ <b>Connected to Hostlink!</b>\n\nYou'll now get notified when tasks are assigned to you.\n\nIf you didn't request this, you can ignore this message.`
    )

    if (sent) {
      console.log('[telegram/webhook/start] ✅ Success message sent')
    } else {
      console.log('[telegram/webhook/start] ❌ Failed to send success message')
    }
  } catch (error) {
    console.error('[telegram/webhook/start] ❌ Error handling /start:', error)
    await sendTelegramMessage(
      chatId,
      '❌ An error occurred while connecting your account. Please try again.'
    )
  }
}
