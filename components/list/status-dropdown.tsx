'use client'

import { Check, ChevronDown, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/hostlink'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { STATUSES, type Status, type Task } from '@/lib/types'
import { allowedTransitions, statusLabels, transitionError } from '@/lib/utils'

export function StatusDropdown({ task, pending, onMove }: { task: Task; pending: boolean; onMove: (task: Task, status: Status) => void }) {
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="sm" disabled={pending} aria-label={`Change status of ${task.key}, ${statusLabels[task.status]}`} />}><StatusBadge status={task.status} />{pending ? <LoaderCircle className="animate-spin" /> : <ChevronDown />}</DropdownMenuTrigger>
    <DropdownMenuContent className="w-64"><DropdownMenuGroup><DropdownMenuLabel>Move {task.key} to</DropdownMenuLabel>{STATUSES.map(status => {
      const current = status === task.status
      const allowed = allowedTransitions(task.status).includes(status)
      const reason = current ? 'This is the current status.' : transitionError(task.status, status)
      const item = <DropdownMenuItem disabled={!allowed} aria-label={`${statusLabels[status]}${!allowed ? ` — ${reason}` : ''}`} onClick={() => onMove(task, status)}><StatusBadge status={status} />{current && <Check className="ml-auto" />}</DropdownMenuItem>
      return allowed ? <div key={status}>{item}</div> : <Tooltip key={status}><TooltipTrigger render={<div tabIndex={0} aria-label={reason} />}>{item}</TooltipTrigger><TooltipContent>{reason}</TooltipContent></Tooltip>
    })}</DropdownMenuGroup></DropdownMenuContent>
  </DropdownMenu>
}
