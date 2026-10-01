'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Bell } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { IconButton, UserAvatar } from '@/components/ui/hostlink'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecentActivity } from '@/lib/hooks'
import { statusLabels } from '@/lib/utils'

export function Notifications() {
  const { data: activity, error } = useRecentActivity()
  const router = useRouter()
  return <DropdownMenu><DropdownMenuTrigger render={<IconButton label={`Recent activity${activity ? `, ${activity.length} updates` : ''}`} className="relative"><Bell />{activity && activity.length > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] leading-none text-primary-foreground">{activity.length}</span>}</IconButton>} /><DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
    <DropdownMenuGroup><DropdownMenuLabel>Recent activity</DropdownMenuLabel>
      {error ? <p role="alert" className="px-3 py-4 text-xs text-danger">Activity could not be loaded.</p> : !activity ? <div className="flex flex-col gap-3 p-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : activity.length === 0 ? <p className="p-4 text-xs text-muted-foreground">You&apos;re all caught up.</p> : activity.map(event => {
        if (!event.user || !event.task || !event.project) return null
        return <DropdownMenuItem key={event.id} onClick={() => router.push(`/projects/${event.projectId}`)} className="items-start gap-3 px-3 py-3">
          <UserAvatar user={event.user} size="sm" /><span className="flex min-w-0 flex-col gap-1"><span className="text-xs leading-5"><strong className="font-medium">{event.user.name.split(' ')[0]}</strong> moved <strong className="font-medium">{event.task.title}</strong> to {statusLabels[event.toStatus]}.</span><span className="text-[11px] text-muted-foreground">{event.project.name} · {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span></span>
        </DropdownMenuItem>
      })}
    </DropdownMenuGroup>
  </DropdownMenuContent></DropdownMenu>
}
