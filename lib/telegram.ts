import { prisma } from '@/lib/db'

// Format date in IST timezone
function formatDateInIST(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

// Format due date (just date, no time)
function formatDueDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

// Priority emoji mapping
function getPriorityEmoji(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
    case 'high':
      return '🔴'
    case 'normal':
    case 'medium':
      return '🔵'
    case 'low':
      return '🟢'
    default:
      return '⚪'
  }
}

// Send a Telegram notification to a user
export async function sendTelegramNotification(chatId: string, taskTitle: string, projectName: string, priority: string, dueDate: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN is not configured')
    return false
  }

  try {
    const notifiedAt = formatDateInIST(new Date())
    const formattedDueDate = formatDueDate(dueDate)
    const priorityEmoji = getPriorityEmoji(priority)

    // Construct task URL - using the projects page pattern
    const taskUrl = 'https://hostlink-ark.vercel.app/projects'

    const message = `
🔔 <b>New Task Assigned</b>

<b>${escapeHtml(taskTitle)}</b>
📁 Project: ${escapeHtml(projectName)}
${priorityEmoji} Priority: ${escapeHtml(priority.charAt(0).toUpperCase() + priority.slice(1))}
📅 Due: ${formattedDueDate}

🔗 <a href="${taskUrl}">Open in Hostlink</a>
⏰ Notified: ${notifiedAt}
    `.trim()

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[telegram] Failed to send notification: ${data.description}`)
      return false
    }

    console.log('[telegram] Notification sent successfully')
    return true
  } catch (error) {
    console.error('[telegram] Error sending notification:', error)
    return false
  }
}

// Send a Telegram confirmation message (for link verification)
export async function sendTelegramConfirmation(chatId: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN is not configured')
    return false
  }

  try {
    const message = `✅ <b>Connected to Hostlink!</b>\n\nYou'll now get notified when tasks are assigned to you.\n\nIf you didn't request this, you can ignore this message.`

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[telegram] Failed to send confirmation: ${data.description}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[telegram] Error sending confirmation:', error)
    return false
  }
}

// Escape HTML special characters for Telegram message formatting
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char])
}

// Generate a linking token for a user
export async function generateLinkingToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 30) // Token expires in 30 minutes

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramLinkToken: token,
      telegramLinkTokenExpiresAt: expiresAt,
    },
  })

  return { token, expiresAt }
}

// Get user's Telegram connection status
export async function getTelegramStatus(userId: string): Promise<{ isConnected: boolean; chatId?: string | null }> {
  console.log('[telegram/getTelegramStatus] Checking status for user:', userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramChatId: true,
    },
  })

  console.log('[telegram/getTelegramStatus] User found:', !!user)
  console.log('[telegram/getTelegramStatus] telegramChatId:', user?.telegramChatId || '(null)')

  const result = {
    isConnected: !!user?.telegramChatId,
    chatId: user?.telegramChatId || null,
  }

  console.log('[telegram/getTelegramStatus] Returning:', result)
  return result
}

// Disconnect Telegram from a user
export async function disconnectTelegram(userId: string): Promise<boolean> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramChatId: null,
    },
  })
  return true
}
