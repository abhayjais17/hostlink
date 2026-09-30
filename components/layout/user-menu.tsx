'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/hostlink'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCurrentUser, useUsers } from '@/lib/hooks'
import { setCurrentUser } from '@/lib/api'

export function UserMenu() {
  const router = useRouter()
  const { data: user, error: userError } = useCurrentUser()
  const { data: users, error } = useUsers()
  const [pending, setPending] = useState(false)
  async function switchUser(id: string) {
    setPending(true)
    try { const next = await setCurrentUser(id); toast.success(`Now acting as ${next.name}`) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not switch user.') }
    finally { setPending(false) }
  }
  if (userError || error) return <span role="alert" className="text-xs text-danger">Users unavailable</span>
  if (!user || !users) return <Skeleton className="size-8 rounded-full" />
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" aria-label={`Switch user, acting as ${user.name}`} disabled={pending} className="gap-2 px-1" />}>
    <UserAvatar user={user} size="sm" /><span className="hidden text-xs lg:inline">{user.name.split(' ')[0]}</span><ChevronDown />
  </DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64">
    <DropdownMenuGroup><DropdownMenuLabel>Acting as · Demo user</DropdownMenuLabel>{users.map(member => <DropdownMenuItem key={member.id} onClick={() => switchUser(member.id)} disabled={pending} className="gap-3 py-2">
      <UserAvatar user={member} /><span className="flex flex-1 flex-col"><span>{member.name}</span><span className="text-xs text-muted-foreground">{member.role}</span></span>{member.id === user.id && <Check aria-label="Current user" />}
    </DropdownMenuItem>)}</DropdownMenuGroup>
    <DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuItem onClick={() => router.push('/')}><LogOut />Leave demo</DropdownMenuItem></DropdownMenuGroup>
  </DropdownMenuContent></DropdownMenu>
}
