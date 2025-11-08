'use client'

import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, LogOut, Bell, Trash2, Pause, Eye } from 'lucide-react'
import { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface SettingsTabProps {
  user: UserItem
}

export const SettingsTab = memo(function SettingsTab({ user }: SettingsTabProps) {
  const { setPermissionModalOpen } = useUsersContext()
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleManagePermissions = useCallback(() => {
    setPermissionModalOpen(true)
  }, [setPermissionModalOpen])

  const handleDeactivate = useCallback(() => {
    alert('User deactivation would be processed here')
    setShowDeactivateDialog(false)
  }, [])

  const handleDelete = useCallback(() => {
    alert('User deletion would be processed here')
    setShowDeleteDialog(false)
  }, [])

  return (
    <div className="max-w-2xl space-y-8">
      {/* Permissions Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900">Access Control</h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <p className="text-sm text-slate-600 mb-4">
            Manage this user&apos;s permissions and role-based access control.
          </p>

          {user.permissions && user.permissions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Current Permissions ({user.permissions.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {user.permissions.slice(0, 8).map((perm, idx) => (
                  <Badge key={idx} className="bg-blue-100 text-blue-800 border border-blue-200 font-normal">
                    {perm}
                  </Badge>
                ))}
                {user.permissions.length > 8 && (
                  <Badge className="bg-slate-100 text-slate-800 border border-slate-200 font-normal">
                    +{user.permissions.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleManagePermissions}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Manage Permissions & Role
          </Button>
        </div>
      </section>

      {/* Security Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <Lock className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-semibold text-slate-900">Security Settings</h3>
        </div>

        <div className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-600 mt-1">
                  Require 2FA for this user&apos;s account access.
                </p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                Not Enabled
              </Badge>
            </div>
            <Button variant="outline" className="w-full">
              Configure 2FA
            </Button>
          </div>

          {/* Password Reset */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Password Management</p>
                <p className="text-sm text-slate-600 mt-1">
                  Reset or enforce password change for this user.
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Send Password Reset Email
            </Button>
          </div>

          {/* Session Management */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Session Management</p>
                <p className="text-sm text-slate-600 mt-1">
                  View and manage active sessions for this user.
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Active Sessions
            </Button>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <Bell className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-slate-900">Notification Preferences</h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <p className="text-sm text-slate-600 mb-4">
            Configure email and notification preferences for this user.
          </p>
          <Button variant="outline" className="w-full">
            Edit Notification Preferences
          </Button>
        </div>
      </section>

      {/* Account Status Management */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <LogOut className="w-5 h-5 text-orange-600" />
          <h3 className="text-base font-semibold text-slate-900">Account Status</h3>
        </div>

        <div className="space-y-4">
          {/* Deactivate */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-orange-900">Deactivate Account</p>
                <p className="text-sm text-orange-800 mt-1">
                  Temporarily deactivate this user. They can be reactivated later.
                </p>
              </div>
              <Badge className="bg-orange-100 text-orange-800 border border-orange-200">
                {user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
            <Button
              variant="outline"
              className="w-full text-orange-700 border-orange-300 hover:bg-orange-100 flex items-center gap-2"
              onClick={() => setShowDeactivateDialog(true)}
            >
              <Pause className="h-4 w-4" />
              Deactivate User
            </Button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-red-300">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h3 className="text-base font-semibold text-red-900">Danger Zone</h3>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-800 mb-4">
            <strong>Warning:</strong> These actions are permanent and cannot be undone. Please be extremely careful.
          </p>
          <Button
            variant="destructive"
            className="w-full flex items-center gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Permanently Delete User
          </Button>
          <p className="text-xs text-red-700 mt-3">
            This will permanently remove the user and all associated data from the system.
          </p>
        </div>
      </section>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{user.name || user.email}</strong>? They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-orange-600 hover:bg-orange-700">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{user.name || user.email}</strong>? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})

SettingsTab.displayName = 'SettingsTab'
