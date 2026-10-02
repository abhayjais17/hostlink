'use client'

import { useState, type FormEvent } from 'react'
import { Check, Moon, Sun, MessageCircle, Link2, Unlink } from 'lucide-react'
import { toast } from 'sonner'
import { useAppearance } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { UserAvatar } from '@/components/ui/hostlink'
import { useCurrentUser } from '@/lib/hooks'
import type { User } from '@/lib/types'
import { PageError, PageFrame, PageLoading } from './page-frame'

function ProfileForm({ user }: { user: User }) {
  const [saved, setSaved] = useState(user)
  const [draft, setDraft] = useState(user)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const dirty = draft.name !== saved.name || draft.email !== saved.email || draft.color !== saved.color
  function submit(event: FormEvent) {
    event.preventDefault()
    const next = { ...draft, name: draft.name.trim(), email: draft.email.trim() }
    const validation = { name: !next.name ? 'Enter your name.' : next.name.length > 100 ? 'Use 100 characters or fewer.' : undefined,
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email) ? 'Enter a valid email address.' : undefined }
    setErrors(validation)
    if (validation.name || validation.email) return
    setSaved(next); setDraft(next)
    toast.success('Profile preview saved', { description: 'Local to this page; your demo account is unchanged.' })
  }
  return <form onSubmit={submit} noValidate><Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Your personal details and avatar.</CardDescription></CardHeader><CardContent className="flex flex-col gap-6"><div className="flex items-center gap-3"><UserAvatar user={{ ...draft, name: draft.name.trim() || user.name }} size="lg" /><div className="min-w-0"><p className="truncate text-sm font-medium text-strong">{draft.name.trim() || user.name}</p><Badge variant="secondary">{user.role}</Badge></div></div><FieldGroup><Field data-invalid={!!errors.name}><FieldLabel htmlFor="profile-name">Full name</FieldLabel><Input id="profile-name" autoComplete="name" maxLength={100} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} required />{errors.name && <FieldError id="name-error">{errors.name}</FieldError>}</Field><Field data-invalid={!!errors.email}><FieldLabel htmlFor="profile-email">Email address</FieldLabel><Input id="profile-email" type="email" autoComplete="email" maxLength={254} value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} required />{errors.email && <FieldError id="email-error">{errors.email}</FieldError>}</Field><Field><FieldLabel htmlFor="avatar-color">Avatar color</FieldLabel><select id="avatar-color" value={draft.color} onChange={event => setDraft({ ...draft, color: event.target.value })} className="h-9 w-full rounded-md border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="teal">Teal</option><option value="indigo">Indigo</option><option value="amber">Amber</option></select><FieldDescription>Your avatar uses initials from your name.</FieldDescription></Field></FieldGroup></CardContent><CardFooter className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-xs text-xs text-muted-foreground">Preview only. Changes reset when you leave this page or switch users.</p><div className="flex items-center gap-2"><Button type="button" variant="secondary" disabled={!dirty} onClick={() => { setDraft(saved); setErrors({}) }}>Cancel</Button><Button type="submit" disabled={!dirty}><Check />Save changes</Button></div></CardFooter></Card></form>
}

function TelegramNotifications({ userId }: { userId: string }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Check connection status on mount
  useState(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/telegram/status')
        const data = await res.json()
        setIsConnected(data.isConnected)
      } catch (error) {
        console.error('Failed to check Telegram status:', error)
        setIsConnected(false)
      }
    }
    checkStatus()
  })

  async function handleConnect() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/telegram/link', { method: 'POST' })
      const data = await res.json()
      if (data.telegramLink) {
        // Open Telegram in new tab
        window.open(data.telegramLink, '_blank')
        // Poll for connection status
        toast.success('Opening Telegram...', { description: 'Click "Start" in the bot to connect your account.' })
        // Check status every 5 seconds
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch('/api/telegram/status')
          const statusData = await statusRes.json()
          if (statusData.isConnected) {
            setIsConnected(true)
            setIsLoading(false)
            clearInterval(pollInterval)
            toast.success('Telegram connected!', { description: 'You will now receive notifications for assigned tasks.' })
          }
        }, 5000)
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          setIsLoading(false)
        }, 120000)
      }
    } catch (error) {
      console.error('Failed to generate Telegram link:', error)
      setIsLoading(false)
      toast.error('Failed to connect Telegram')
    }
  }

  async function handleDisconnect() {
    setIsDisconnecting(true)
    try {
      await fetch('/api/telegram/disconnect', { method: 'POST' })
      setIsConnected(false)
      toast.success('Telegram disconnected')
    } catch (error) {
      console.error('Failed to disconnect Telegram:', error)
      toast.error('Failed to disconnect Telegram')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-5" />
          Telegram Notifications
        </CardTitle>
        <CardDescription>Get notified when tasks are assigned to you via Telegram.</CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Checking connection status...
          </div>
        ) : isConnected ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              ✅ Connected
            </Badge>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Connect your Telegram account to receive notifications when tasks are assigned to you.
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button variant="outline" onClick={handleDisconnect} disabled={isDisconnecting}>
            <Unlink className="size-4 mr-2" />
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={isLoading}>
            <Link2 className="size-4 mr-2" />
            {isLoading ? 'Connecting...' : 'Connect Telegram'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export function SettingsPage() {
  const result = useCurrentUser()
  const { dark, setDark } = useAppearance()
  if (result.error) return <PageError retry={() => void result.mutate()} />
  if (!result.data) return <PageLoading label="settings" />
  return <PageFrame><div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"><ProfileForm key={result.data.id} user={result.data} /><div className="flex min-w-0 flex-col gap-5"><TelegramNotifications userId={result.data.id} /><Card><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>A comfortable view for the way you work.</CardDescription></CardHeader><CardContent className="flex flex-col gap-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3">{dark ? <Moon className="size-5 text-muted-foreground" /> : <Sun className="size-5 text-muted-foreground" />}<div><p id="dark-mode-label" className="text-sm font-medium text-strong">Dark mode</p><p className="text-xs text-muted-foreground">{dark ? 'Easy on the eyes after hours.' : 'A bright, clear workspace.'}</p></div></div><Button type="button" variant={dark ? 'default' : 'secondary'} role="switch" aria-checked={dark} aria-labelledby="dark-mode-label" onClick={() => setDark(!dark)}>{dark ? 'On' : 'Off'}</Button></div><div className="overflow-hidden rounded-lg border bg-canvas p-3" aria-hidden="true"><div className="flex h-28 overflow-hidden rounded border bg-surface"><div className="flex w-12 shrink-0 flex-col gap-2 bg-sidebar p-2"><span className="mb-2 size-4 rounded bg-sidebar-primary" /><span className="h-1 rounded bg-sidebar-foreground/40" /><span className="h-1 rounded bg-sidebar-foreground/20" /><span className="h-1 rounded bg-sidebar-foreground/20" /></div><div className="flex flex-1 flex-col gap-3 p-3"><span className="h-2 w-20 rounded bg-body/30" /><div className="grid flex-1 grid-cols-3 gap-2">{[1, 2, 3].map(item => <div key={item} className="flex flex-col gap-2 rounded border bg-canvas p-2"><span className="h-1 w-2/3 rounded bg-primary" /><span className="h-1 rounded bg-body/15" /><span className="h-1 rounded bg-body/15" /></div>)}</div></div></div></div></CardContent><CardFooter><p className="text-xs text-muted-foreground">Applies to the entire app. Appearance resets to light on reload.</p></CardFooter></Card><div className="rounded-lg border border-dashed p-4"><h2 className="text-sm font-medium">A safe space to try things</h2><p className="mt-1 text-xs text-muted-foreground">This workspace uses in-memory demo data. Profile edits do not change your team identity or other users.</p></div></div></div></PageFrame>
}
