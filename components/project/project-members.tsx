'use client'

import { useState } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IconButton, Modal, UserAvatar } from '@/components/ui/hostlink'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { domainStore } from '@/lib/store'
import * as api from '@/lib/api'

interface Member {
  id: string
  userId: string
  name: string
  email: string
  role: string
  color: string
}

interface ProjectMembersProps {
  projectId: string
  members: Member[]
  onMembersChange?: () => void
}

export function ProjectMembers({ projectId, members: initialMembers, onMembersChange }: ProjectMembersProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [members, setMembers] = useState(initialMembers)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await api.searchUsers(query, projectId)
      setSearchResults(results)
    } catch (error) {
      console.error(error)
    } finally {
      setSearching(false)
    }
  }

  async function handleAddMember(userId: string, userName: string) {
    try {
      const newMember = await api.addProjectMember(projectId, userId)
      setMembers([...members, newMember])
      setSearchQuery('')
      setSearchResults([])
      toast.success(`${userName} added to project`)

      // Trigger domain store revision to refresh project data
      domainStore.setState({ revision: domainStore.getState().revision + 1 })
      onMembersChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member')
    }
  }

  async function handleRemoveMember(userId: string, userName: string) {
    if (!confirm(`Remove ${userName} from this project? Their assigned tasks will remain, but they won't be able to access this project.`)) {
      return
    }

    setRemoving(userId)
    try {
      await api.removeProjectMember(projectId, userId)
      setMembers(members.filter(m => m.userId !== userId))
      toast.success(`${userName} removed from project`)

      // Trigger domain store revision to refresh project data
      domainStore.setState({ revision: domainStore.getState().revision + 1 })
      onMembersChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        <span className="hidden sm:inline">Add member</span>
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Project members"
        description="Add or remove people from this project."
      >
        <div className="flex flex-col gap-4">
          {/* Search to add members */}
          <Field>
            <FieldLabel htmlFor="member-search">Add member</FieldLabel>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="member-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </Field>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border bg-surface p-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddMember(user.id, user.name)}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserAvatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <p className="text-sm text-muted-foreground">Searching...</p>
          )}

          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found</p>
          )}

          {/* Current members list */}
          <div>
            <p className="mb-2 text-sm font-medium">Current members ({members.length})</p>
            <div className="flex flex-col gap-1 rounded-lg border bg-surface p-2">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="group flex items-center gap-3 rounded-md px-2 py-2"
                >
                  <UserAvatar user={member} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <IconButton
                    label={`Remove ${member.name}`}
                    onClick={() => handleRemoveMember(member.userId, member.name)}
                    disabled={removing === member.userId}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <X className="size-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
