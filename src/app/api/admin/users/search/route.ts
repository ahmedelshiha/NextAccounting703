import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const revalidate = 30 // ISR: Revalidate every 30 seconds for search results

export interface UserFilterOptions {
  search?: string
  role?: string
  status?: string
  department?: string
  tier?: string
  experienceYears?: { min?: number; max?: number }
  createdAfter?: string
  createdBefore?: string
  sortBy?: 'name' | 'email' | 'createdAt' | 'role'
  sortOrder?: 'asc' | 'desc'
  page: number
  limit: number
}

export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId ?? null

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-users-search:${ip}`, 100, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!ctx.userId) return respond.unauthorized()
    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    const filters: UserFilterOptions = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      department: searchParams.get('department') || undefined,
      tier: searchParams.get('tier') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    }

    // Parse date filters
    if (searchParams.get('createdAfter')) {
      filters.createdAfter = searchParams.get('createdAfter') || undefined
    }
    if (searchParams.get('createdBefore')) {
      filters.createdBefore = searchParams.get('createdBefore') || undefined
    }

    // Parse experience range
    const minExp = searchParams.get('minExperience')
    const maxExp = searchParams.get('maxExperience')
    if (minExp || maxExp) {
      filters.experienceYears = {
        min: minExp ? parseInt(minExp, 10) : undefined,
        max: maxExp ? parseInt(maxExp, 10) : undefined
      }
    }

    // Build Prisma where clause
    const where: any = tenantFilter(tenantId)

    // Add search filter (search across name, email, company)
    if (filters.search && filters.search.length >= 2) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Add role filter
    if (filters.role) {
      where.role = filters.role
    }

    // Add status filter
    if (filters.status) {
      where.status = filters.status
    }

    // Add department filter
    if (filters.department) {
      where.department = filters.department
    }

    // Add tier filter
    if (filters.tier) {
      where.tier = filters.tier
    }

    // Add experience range filter
    if (filters.experienceYears) {
      where.experienceYears = {}
      if (filters.experienceYears.min !== undefined) {
        where.experienceYears.gte = filters.experienceYears.min
      }
      if (filters.experienceYears.max !== undefined) {
        where.experienceYears.lte = filters.experienceYears.max
      }
    }

    // Add date filters
    if (filters.createdAfter) {
      where.createdAt = { gte: new Date(filters.createdAfter) }
    }
    if (filters.createdBefore) {
      if (!where.createdAt) where.createdAt = {}
      where.createdAt.lte = new Date(filters.createdBefore)
    }

    // Build sort order
    const orderBy: any = {}
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit

    // Execute queries in parallel
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          availabilityStatus: true,
          department: true,
          position: true,
          tier: true,
          experienceYears: true,
          hourlyRate: true,
          skills: true,
          certifications: true,
          image: true,
          hireDate: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy,
        skip,
        take: filters.limit
      })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / filters.limit)
    const hasNextPage = filters.page < totalPages
    const hasPreviousPage = filters.page > 1

    // Build response object
    const responseData = {
      success: true,
      data: users,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      appliedFilters: {
        search: filters.search,
        role: filters.role,
        status: filters.status,
        department: filters.department,
        tier: filters.tier,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }
    }

    // Generate ETag from response data for caching
    const etagData = JSON.stringify(responseData)
    const etag = `"${createHash('sha256').update(etagData).digest('hex')}"`

    // Check If-None-Match header for conditional request
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } })
    }

    // Return response with caching headers
    return NextResponse.json(responseData, {
      headers: {
        ETag: etag,
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        'X-Total-Count': total.toString(),
        'X-Total-Pages': totalPages.toString(),
        'X-Current-Page': filters.page.toString(),
        'X-Page-Size': filters.limit.toString()
      }
    })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { error: 'Failed to search users', success: false },
      { status: 500 }
    )
  }
})
