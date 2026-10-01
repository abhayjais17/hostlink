'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/hostlink'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCurrentUser, useUsers } from '@/lib/hooks'
import * as api from '@/lib/api'

export function UserMenu() {
  const router = useRouter()
  const { data: user, error: userError, mutate: reloadUser } = useCurrentUser()
  const { data: users } = useUsers()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    try {
      await api.logout()
      toast.success('Logged out successfully')
      router.refresh()
      router.push('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not log out')
    } finally {
      setPending(false)
    }
  }

  if (userError) return <span role="alert" className="text-xs text-danger">User unavailable</span>
  if (!user) return <User className="size-8 rounded-full bg-muted p-1.5 text-muted-foreground" />

  return <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="ghost" aria-label={`Account, ${user.name}`} disabled={pending} className="gap-2 px-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
      <UserAvatar user={user} size="sm" />
      <span className="hidden text-xs lg:inline">{user.name.split(' ')[0]}</span>
      <ChevronDown />
    </Button>}>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-64">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="flex flex-col gap-1 py-2">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => router.push('/my-tasks')} disabled={pending}>
          <User className="mr-2 size-4" />
          My Tasks
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} disabled={pending}>
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
}
