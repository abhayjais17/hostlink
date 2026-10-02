'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { formatDistanceToNowStrict } from 'date-fns'
import { ArrowRight, MessageSquare, Trash2, GitCommit } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { IconButton, LoadingButton, Modal, StatusBadge, UserAvatar } from '@/components/ui/hostlink'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { addComment, deleteComment } from '@/lib/api'
import { useComments, useCurrentUser, useTaskEvents, useTaskCommits } from '@/lib/hooks'
import type { User } from '@/lib/types'

export function TaskActivity({ taskId, users }: { taskId: string; users: User[] }) {
  const { data: comments, error: commentError, mutate: reloadComments } = useComments(taskId)
  const { data: events, error: eventError, mutate: reloadEvents } = useTaskEvents(taskId)
  const { data: commits, error: commitError } = useTaskCommits(taskId)
  const { data: currentUser } = useCurrentUser()
  const [tab, setTab] = useState('all')
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Build activity list from all sources - each source is independent
  const hasComments = comments && !commentError
  const hasEvents = events && !eventError
  const hasCommits = commits && !commitError

  const activity = [
    ...(tab !== 'history' && hasComments ? (comments ?? []).map(comment => ({ kind: 'comment' as const, id: comment.id, date: comment.createdAt, userId: comment.authorId, comment })) : []),
    ...(tab !== 'comments' && hasEvents ? (events ?? []).map(event => ({ kind: 'event' as const, id: event.id, date: event.createdAt, userId: event.userId, event })) : []),
    ...(tab !== 'comments' && hasCommits ? (commits ?? []).map(commit => ({ kind: 'commit' as const, id: commit.id, date: commit.committedAt, userId: commit.authorUser?.id || null, commit })) : []),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // Show loading state only when ALL sources are loading
  const allLoading = !comments && !events && !commits

  async function post() {
    if (!currentUser || saving.current || !body.trim()) return
    saving.current = true; setPending(true); setError('')
    try {
      await addComment(taskId, currentUser.id, body)
      await reloadComments()
      setBody('')
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'instant' : 'smooth' }))
    } catch (error) { const message = error instanceof Error ? error.message : 'Could not post comment.'; setError(message); toast.error(message) }
    finally { saving.current = false; setPending(false) }
  }
  async function remove() {
    if (!deleting || saving.current) return
    saving.current = true; setPending(true)
    try { await deleteComment(deleting); setDeleting(null); toast.success('Comment deleted') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete comment.') }
    finally { saving.current = false; setPending(false) }
  }
  return <section aria-label="Task activity" className="flex min-w-0 flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Activity</h3><span className="text-xs text-muted-foreground">{comments?.length ?? 0} comments</span></div>
    <ToggleGroup aria-label="Activity view" variant="outline" spacing={0} value={[tab]} onValueChange={values => { if (values.length) setTab(String(values[0])) }}>{['all', 'comments', 'history'].map(value => <ToggleGroupItem key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</ToggleGroupItem>)}</ToggleGroup>

    {/* Show independent error messages for each source */}
    {commentError && <div role="alert" className="text-xs text-muted-foreground p-2 bg-muted/50 rounded"><p>⚠️ Could not load comments. <Button variant="link" className="h-auto p-0 text-xs" onClick={() => void reloadComments()}>Retry</Button></p></div>}
    {eventError && <div role="alert" className="text-xs text-muted-foreground p-2 bg-muted/50 rounded"><p>⚠️ Could not load history. <Button variant="link" className="h-auto p-0 text-xs" onClick={() => void reloadEvents()}>Retry</Button></p></div>}
    {commitError && <div role="alert" className="text-xs text-muted-foreground p-2 bg-muted/50 rounded"><p>⚠️ Could not load commits.</p></div>}

    {/* Show loading state only when ALL sources are loading */}
    {allLoading ? <div aria-label="Loading activity" className="flex flex-col gap-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : <ol aria-label="Activity thread" className="flex flex-col gap-5">{activity.map(item => {
      const user = users.find(user => user.id === item.userId)
      return <motion.li key={item.id} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.18 }} className="flex min-w-0 gap-2">
        {user && <UserAvatar user={user} size="sm" />}
        {!user && item.kind === 'commit' && item.commit.authorUser && <UserAvatar user={{ id: item.commit.authorUser.id, name: item.commit.authorUser.name, color: item.commit.authorUser.color, email: '', role: 'member' }} size="sm" />}
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-xs font-medium text-strong">{user?.name ?? (item.kind === 'commit' ? (item.commit.authorUser?.name || item.commit.authorName) : 'Team member')}</span><time dateTime={item.date} title={new Date(item.date).toLocaleString()} className="text-[11px] text-muted-foreground">{formatDistanceToNowStrict(new Date(item.date), { addSuffix: true })}</time>{item.kind === 'comment' && item.userId === currentUser?.id && <IconButton label="Delete comment" className="ml-auto" disabled={pending} onClick={() => setDeleting(item.id)}><Trash2 /></IconButton>}</div>
          {item.kind === 'comment' ? <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-5">{item.comment.body}</p> : item.kind === 'event' ? <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><span>{item.event.fromStatus ? 'moved this' : 'created this in'}</span>{item.event.fromStatus && <><StatusBadge status={item.event.fromStatus} /><ArrowRight className="size-3" aria-hidden="true" /></>}<StatusBadge status={item.event.toStatus} /></div> : <div className="mt-1 flex flex-col gap-1"><a href={item.commit.commitUrl.startsWith('https://github.com/') ? item.commit.commitUrl : '#'} target="_blank" rel="noopener noreferrer" className="text-[13px] leading-5 hover:underline flex items-center gap-1.5"><GitCommit className="size-3.5 flex-shrink-0" aria-hidden="true" /><span className="truncate">{item.commit.commitMessage.split('\n')[0]}</span></a>{item.commit.branch && <span className="text-[11px] text-muted-foreground">on {item.commit.branch}</span>}</div>}
        </div>
      </motion.li>
    })}</ol>}
    {comments && events && !activity.length && <p className="py-4 text-xs text-muted-foreground">{tab === 'comments' ? 'No comments yet. Start the conversation below.' : 'No activity yet.'}</p>}
    <div ref={endRef} />
    {tab !== 'history' && <form onSubmit={event => { event.preventDefault(); void post() }} className="flex items-start gap-2">
      {currentUser && <UserAvatar user={currentUser} size="sm" />}<div className="flex min-w-0 flex-1 flex-col gap-2"><Field><FieldLabel htmlFor="task-comment" className="sr-only">Add a comment</FieldLabel><Textarea id="task-comment" rows={3} value={body} disabled={pending || !currentUser} maxLength={10000} placeholder="Add a comment…" aria-describedby={error ? 'comment-error' : undefined} onChange={event => setBody(event.target.value)} onKeyDown={event => { if (event.nativeEvent.isComposing || event.keyCode === 229) return; if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void post() } }} /></Field>{error && <p role="alert" id="comment-error" className="text-xs text-danger">{error}</p>}<div className="flex items-center gap-2"><LoadingButton type="submit" pending={pending} disabled={!body.trim() || !currentUser}><MessageSquare />Comment</LoadingButton><Button type="button" variant="ghost" disabled={pending || !body} onClick={() => { setBody(''); setError('') }}>Cancel</Button></div></div>
    </form>}
    <Modal children={null} open={!!deleting} onOpenChange={open => { if (!open && !pending) setDeleting(null) }} title="Delete comment?" description="This comment will be permanently removed from the thread." footer={<><Button variant="secondary" disabled={pending} onClick={() => setDeleting(null)}>Cancel</Button><LoadingButton variant="destructive" pending={pending} onClick={() => void remove()}>Delete comment</LoadingButton></>} />
  </section>
}
