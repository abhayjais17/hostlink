'use client'

import type { ComponentProps, ReactNode } from 'react'
import { AlertCircle, ArrowUp, Check, ChevronDown, ChevronsUp, Circle, CircleCheck, CircleDashed, CircleDot, LoaderCircle, Minus, ScanEye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn, initials, statusLabels } from '@/lib/utils'
import type { Priority, Status, User } from '@/lib/types'

const statusIcons = { backlog: CircleDashed, in_progress: CircleDot, review: ScanEye, done: CircleCheck }
const priorityIcons = { urgent: ChevronsUp, high: ArrowUp, normal: Minus }
const avatarColors: Record<string, string> = {
  teal: 'bg-avatar-teal text-primary-foreground', indigo: 'bg-avatar-indigo text-primary-foreground', amber: 'bg-avatar-amber text-primary-foreground',
}
export function StatusBadge({ status }: { status: Status }) {
  const Icon = statusIcons[status]
  return <Badge variant={status}><Icon data-icon="inline-start" />{statusLabels[status]}</Badge>
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = priorityIcons[priority]
  return <Badge variant={priority}><Icon data-icon="inline-start" />{priority[0].toUpperCase() + priority.slice(1)}</Badge>
}
export function OverdueBadge() { return <Badge variant="overdue"><AlertCircle data-icon="inline-start" />Overdue</Badge> }
export function UserAvatar({ user, size = 'default' }: { user: User; size?: 'default' | 'sm' | 'lg' }) {
  return <Avatar size={size} title={user.name} aria-label={user.name}><AvatarFallback className={cn('font-medium', avatarColors[user.color] ?? avatarColors.teal)}>{initials(user.name)}</AvatarFallback></Avatar>
}
export function UserAvatarStack({ users, max = 3 }: { users: User[]; max?: number }) {
  const limit = Math.max(1, max)
  return <AvatarGroup aria-label="Project members">{users.slice(0, limit).map(user => <UserAvatar key={user.id} user={user} />)}{users.length > limit && <AvatarGroupCount aria-label={`${users.length - limit} more members`}>+{users.length - limit}</AvatarGroupCount>}</AvatarGroup>
}
export function IconButton({ label, children, ...props }: Omit<ComponentProps<typeof Button>, 'children'> & { label: string; children: ReactNode }) {
  return <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} {...props} />}>{children}</TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}
export function LoadingButton({ pending, children, ...props }: ComponentProps<typeof Button> & { pending: boolean }) {
  return <Button {...props} disabled={pending || props.disabled} aria-busy={pending} data-loading={pending || undefined}>
    <span className="grid place-items-center"><span className={cn('col-start-1 row-start-1 inline-flex items-center gap-1.5', pending && 'invisible')}>{children}</span>{pending && <LoaderCircle aria-label="Saving" className="col-start-1 row-start-1 animate-spin" />}</span>
  </Button>
}
export function SplitButton({ children, onClick, actions }: { children: ReactNode; onClick: () => void; actions: { label: string; onClick: () => void }[] }) {
  return <div className="inline-flex items-center">
    <Button onClick={onClick} className="rounded-r-none">{children}</Button>
    <DropdownMenu><DropdownMenuTrigger render={<Button className="rounded-l-none border-l-primary-foreground/25" size="icon" aria-label="More actions" />}><ChevronDown /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44"><DropdownMenuGroup>{actions.map(action => <DropdownMenuItem key={action.label} onClick={action.onClick}>{action.label}</DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent>
    </DropdownMenu>
  </div>
}
export function Modal({ open, onOpenChange, title, description, children, footer }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; footer?: ReactNode
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto [overflow-wrap:anywhere] sm:max-w-lg">
    <DialogHeader><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader>
    {children}{footer && <DialogFooter>{footer}</DialogFooter>}
  </DialogContent></Dialog>
}
export function SavedIndicator({ visible }: { visible: boolean }) {
  return <span role="status" className={cn('inline-flex items-center gap-1 text-sm text-muted-foreground transition-opacity', !visible && 'opacity-0')}><Check className="size-4 text-success" />Saved</span>
}
export function StatusDot({ status }: { status: Status }) {
  return <Circle aria-label={statusLabels[status]} className={cn('size-2 fill-current', { 'text-status-backlog': status === 'backlog', 'text-status-progress': status === 'in_progress', 'text-status-review': status === 'review', 'text-status-done': status === 'done' })} />
}
