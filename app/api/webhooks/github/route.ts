import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/db'

// Verify HMAC signature from GitHub
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.error('GITHUB_WEBHOOK_SECRET is not set')
    return false
  }

  if (!signature) {
    return false
  }

  // GitHub sends "sha256=<hex>"
  const signaturePrefix = 'sha256='
  if (!signature.startsWith(signaturePrefix)) {
    return false
  }

  const signatureHex = signature.slice(signaturePrefix.length)
  const signatureBuffer = Buffer.from(signatureHex, 'hex')

  // Compute HMAC
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const computedBuffer = hmac.digest()

  // Use timingSafeEqual
  if (signatureBuffer.length !== computedBuffer.length) {
    return false
  }

  return computedBuffer.equals(signatureBuffer)
}

// Extract task keys from commit message
function extractTaskKeys(message: string): string[] {
  const regex = /\bHL-(\d+)\b/gi
  const matches = message.match(regex) || []

  // Normalize to uppercase, deduplicate, cap at 10
  const keys = [...new Set(matches.map(m => m.toUpperCase()))].slice(0, 10)
  return keys
}

// Parse GitHub webhook payload
interface GitHubCommit {
  id: string
  message: string
  timestamp: string
  author: {
    name: string
    email: string
    username?: string
  }
  url: string
}

interface GitHubPushPayload {
  ref: string
  deleted: boolean
  commits: GitHubCommit[]
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()

    // Get signature header
    const signature = request.headers.get('X-Hub-Signature-256')
    const eventType = request.headers.get('X-GitHub-Event')

    // Verify secret is set
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) {
      console.error('[webhook] GITHUB_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature || '', secret)) {
      console.warn('[webhook] Invalid or missing signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse JSON payload
    let payload: GitHubPushPayload
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error('[webhook] Failed to parse JSON:', error)
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Handle ping event
    if (eventType === 'ping') {
      console.log('[webhook] Received ping event')
      return NextResponse.json({ status: 'pong' })
    }

    // Return 200 for non-push events
    if (eventType !== 'push') {
      console.log(`[webhook] Ignoring non-push event: ${eventType}`)
      return NextResponse.json({ status: 'ok' })
    }

    // Ignore deleted branches
    if (payload.deleted) {
      console.log('[webhook] Ignoring deleted branch event')
      return NextResponse.json({ status: 'ok' })
    }

    // Ignore if no commits
    if (!payload.commits || payload.commits.length === 0) {
      console.log('[webhook] No commits in payload')
      return NextResponse.json({ status: 'ok' })
    }

    // Extract branch from ref (e.g., "refs/heads/main" -> "main")
    const branch = payload.ref.replace(/^refs\/heads\//, '')

    // Process each commit
    for (const commit of payload.commits) {
      // Extract task keys
      const taskKeys = extractTaskKeys(commit.message)

      if (taskKeys.length === 0) {
        console.log(`[webhook] Commit ${commit.id.slice(0, 7)} has no task keys`)
        continue
      }

      // Match author to User by email
      let authorUserId: string | null = null
      try {
        const user = await prisma.user.findUnique({
          where: { email: commit.author.email.toLowerCase() }
        })
        if (user) {
          authorUserId = user.id
        }
      } catch (error) {
        console.warn(`[webhook] Failed to look up user by email:`, error)
      }

      // Truncate message to 2000 chars
      const truncatedMessage = commit.message.slice(0, 2000)

      // For each task key, create CommitLink
      for (const taskKey of taskKeys) {
        try {
          // Look up task by key
          const task = await prisma.task.findUnique({
            where: { key: taskKey }
          })

          if (!task) {
            console.log(`[webhook] Task key ${taskKey} not found, skipping`)
            continue
          }

          // Create or skip duplicate CommitLink
          try {
            await prisma.commitLink.create({
              data: {
                taskId: task.id,
                commitSha: commit.id,
                commitMessage: truncatedMessage,
                authorName: commit.author.name,
                authorEmail: commit.author.email,
                authorUserId,
                githubUsername: commit.author.username || null,
                branch,
                commitUrl: commit.url,
                committedAt: new Date(commit.timestamp)
              }
            })
            console.log(`[webhook] Created CommitLink for task ${taskKey} commit ${commit.id.slice(0, 7)}`)
          } catch (error: any) {
            // Ignore unique constraint violations (redelivery)
            if (error.code === 'P2002') {
              console.log(`[webhook] CommitLink already exists for task ${taskKey} commit ${commit.id.slice(0, 7)}`)
            } else {
              throw error
            }
          }
        } catch (error) {
          console.error(`[webhook] Error creating CommitLink for task ${taskKey}:`, error)
          // Don't fail the entire webhook for one task
        }
      }
    }

    return NextResponse.json({ status: 'processed', commits: payload.commits.length })
  } catch (error) {
    console.error('[webhook] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
