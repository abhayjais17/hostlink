'use client'

import { useState } from 'react'
import { User } from '@/lib/types'
import { updateProjectMember } from '@/lib/api'
import useSWR from 'swr'

interface MemberWithUser {
  id: string
  userId: string
  name: string
  email: string
  role: 'leader' | 'member'
  designation: string | null
  userRole: string
  color: string
}

interface TeamManagementProps {
  projectId: string
  currentUser: User
}

export function TeamManagement({ projectId, currentUser }: TeamManagementProps) {
  const { data: members, mutate } = useSWR<MemberWithUser[]>(
    `/api/projects/${projectId}/members`,
    async () => {
      const res = await fetch(`/api/projects/${projectId}/members`)
      if (!res.ok) throw new Error('Failed to load members')
      return res.json()
    }
  )

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<'leader' | 'member'>('member')
  const [editDesignation, setEditDesignation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!members) return <div className="text-sm text-gray-500">Loading team...</div>

  const currentMember = members.find(m => m.userId === currentUser.id)
  const isLeader = currentMember?.role === 'leader'

  const handleEdit = (member: MemberWithUser) => {
    setEditingMemberId(member.id)
    setEditRole(member.role)
    setEditDesignation(member.designation || '')
    setError(null)
  }

  const handleSave = async (userId: string) => {
    setSaving(true)
    setError(null)
    try {
      await updateProjectMember(projectId, userId, {
        role: editRole,
        designation: editDesignation.trim() || undefined
      })
      await mutate()
      setEditingMemberId(null)
    } catch (err: any) {
      setError(err.error || 'Failed to update member')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingMemberId(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <span className="text-sm text-gray-500">{members.length} members</span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: member.color }}
            >
              {member.name[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              {editingMemberId === member.id ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as 'leader' | 'member')}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={saving}
                    >
                      <option value="leader">Leader</option>
                      <option value="member">Member</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Designation (optional)"
                      value={editDesignation}
                      onChange={e => setEditDesignation(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={saving}
                      maxLength={100}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(member.userId)}
                      disabled={saving}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{member.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        member.role === 'leader'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {member.role === 'leader' ? 'Leader' : 'Member'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {member.designation || member.email}
                  </div>
                </>
              )}
            </div>

            {isLeader && member.userId !== currentUser.id && editingMemberId !== member.id && (
              <button
                onClick={() => handleEdit(member)}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
