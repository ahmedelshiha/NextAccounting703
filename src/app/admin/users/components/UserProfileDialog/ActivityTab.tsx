'use client'

import React, { memo, useEffect, useCallback } from 'react'
import { Loader2, Clock, AlertCircle } from 'lucide-react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { apiFetch } from '@/lib/api'

interface ActivityTabProps {
  userId: string
}

const formatActivityDate = (iso?: string) => {
  if (!iso) return 'Unknown time'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Invalid date'
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatActivityTime = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export const ActivityTab = memo(function ActivityTab({ userId }: ActivityTabProps) {
  const { activity, setActivity, activityLoading, setActivityLoading, activityError, setActivityError } =
    useUsersContext()

  const loadActivity = useCallback(async () => {
    if (activity.length > 0) return

    setActivityLoading(true)
    setActivityError(null)

    try {
      let res = await apiFetch(`/api/admin/activity?userId=${encodeURIComponent(userId)}&limit=20`)
      if (!res.ok) {
        res = await apiFetch('/api/admin/activity?type=AUDIT&limit=20')
      }
      if (!res.ok) throw new Error(`Failed to load activity (${res.status})`)

      const list = await res.json()
      setActivity(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load activity:', err)
      setActivity([])
      setActivityError('Unable to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [userId, activity.length, setActivity, setActivityLoading, setActivityError])

  useEffect(() => {
    loadActivity().catch(console.error)
  }, [loadActivity])

  if (activityLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <span className="text-slate-600 font-medium">Loading activity history...</span>
      </div>
    )
  }

  if (activityError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-900">Error loading activity</p>
          <p className="text-sm text-red-700 mt-1">{activityError}</p>
        </div>
      </div>
    )
  }

  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Clock className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">No activity recorded</p>
        <p className="text-sm text-slate-500 mt-1">User activity history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activity.map((log, idx) => (
        <div
          key={log.id || idx}
          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {log.message || 'System activity'}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                {formatActivityTime(log.checkedAt)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatActivityDate(log.checkedAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

ActivityTab.displayName = 'ActivityTab'
