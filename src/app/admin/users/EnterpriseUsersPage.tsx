'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { TabNavigation, TabType } from './components/TabNavigation'
import {
  DashboardTab,
  ExecutiveDashboardTab,
  EntitiesTab,
  WorkflowsTab,
  BulkOperationsTab,
  AuditTab,
  AdminTab,
  RbacTab
} from './components/tabs'
import { CreateUserModal } from '@/components/admin/shared/CreateUserModal'
import { useUsersContext } from './contexts/UsersContextProvider'
import { ErrorBoundary } from '@/components/providers/error-boundary'
import { TabSkeleton, DashboardTabSkeleton, MinimalTabSkeleton } from './components/TabSkeleton'
import { toast } from 'sonner'

/**
 * Enterprise Users Page - Phase 4 Implementation
 * 
 * Main orchestrator component that implements the 5-tab interface:
 * 1. Dashboard (Operations overview) - Phase 4a
 * 2. Workflows (Workflow management) - Phase 4b
 * 3. Bulk Operations (Batch operations) - Phase 4c
 * 4. Audit (Compliance & audit trail) - Phase 4d
 * 5. Admin (System configuration) - Phase 4e
 * 
 * Architecture:
 * - Tab-based navigation with React Context
 * - Server-side data fetching via layout.tsx
 * - Client-side state management for filters and selections
 * - Dynamic imports for heavy modals
 * - Performance optimized with code splitting
 * 
 * Timeline: 9 weeks, 195 developer hours
 * Status: Phase 4a in progress
 */
export function EnterpriseUsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)

  // Initialize tab from URL query (?tab=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab') as TabType | null
      const validTabs: TabType[] = ['dashboard', 'entities', 'workflows', 'bulk-operations', 'audit', 'rbac', 'admin']
      if (tab && (validTabs as string[]).includes(tab)) {
        setActiveTab(tab)
      }
    }
  }, [])
  const context = useUsersContext()

  // Handler for Add User action
  const handleAddUser = () => {
    setIsCreateUserModalOpen(true)
  }

  // Handler for successful user creation
  const handleUserCreated = (userId: string) => {
    toast.success('User created successfully')
    setIsCreateUserModalOpen(false)
    // Trigger refresh of users list
    context.refreshUsers?.()
  }

  // Handler for Import action
  const handleImport = () => {
    toast.info('Import CSV feature coming in Phase 4c (Bulk Operations)')
    setActiveTab('bulk-operations')
  }

  // Handler for Bulk Operation action
  const handleBulkOperation = () => {
    toast.info('Bulk Operations feature coming in Phase 4c')
    setActiveTab('bulk-operations')
  }

  // Handler for Export action
  const handleExport = async () => {
    const toastId = toast.loading('Preparing export...')
    try {
      // Build CSV headers
      const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login']

      // Build CSV rows
      const rows = context.users.map(user => [
        user.id,
        user.name || '',
        user.email,
        user.role,
        user.isActive ? 'ACTIVE' : 'INACTIVE',
        new Date(user.createdAt).toLocaleDateString(),
        user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          const value = String(cell || '')
          return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value
        }).join(','))
      ].join('\n')

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.dismiss(toastId)
      toast.success(`Exported ${context.users.length} users successfully`)
    } catch (error) {
      console.error('Export error:', error)
      toast.dismiss(toastId)
      toast.error('Failed to export users')
    }
  }

  // Handler for Refresh action
  const handleRefresh = async () => {
    const toastId = toast.loading('Refreshing data...')
    try {
      // Trigger data refresh through context or API
      if (context.refreshUsers) {
        await context.refreshUsers()
      }

      toast.dismiss(toastId)
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('Refresh error:', error)
      toast.dismiss(toastId)
      toast.error('Failed to refresh data')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="bg-white min-h-[calc(100vh-100px)]">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Suspense fallback={<div className="p-8">Loading dashboard...</div>}>
            <ExecutiveDashboardTab
              users={context.users}
              stats={context.stats}
              isLoading={context.usersLoading || context.isLoading}
              onAddUser={handleAddUser}
              onImport={handleImport}
              onBulkOperation={handleBulkOperation}
              onExport={handleExport}
              onRefresh={handleRefresh}
            />
          </Suspense>
        )}

        {/* Entities Tab */}
        {activeTab === 'entities' && <EntitiesTab />}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && <WorkflowsTab />}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk-operations' && <BulkOperationsTab />}

        {/* Audit Tab */}
        {activeTab === 'audit' && <AuditTab />}

        {/* RBAC Tab */}
        {activeTab === 'rbac' && <RbacTab />}

        {/* Admin Settings Tab */}
        {activeTab === 'admin' && <AdminTab />}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSuccess={handleUserCreated}
        mode="create"
        showPasswordGeneration={true}
      />

      {/* Error message display */}
      {context.errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg">
          {context.errorMsg}
        </div>
      )}
    </div>
  )
}
