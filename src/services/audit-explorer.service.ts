import { prisma } from "../lib/db/prisma";
import { assertAdmin } from "../lib/auth/rbac";
import { AuthenticatedUser } from "../lib/auth/session";
import { Prisma } from "@prisma/client";

export interface AuditLogQueryParams {
  userId?: string;
  action?: string;
  entityType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class AuditExplorerService {
  /**
   * Queries and searches system audit logs (Admin only).
   */
  static async queryLogs(
    user: AuthenticatedUser,
    params: AuditLogQueryParams
  ) {
    assertAdmin(user);

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = { contains: params.action, mode: "insensitive" };
    if (params.entityType) where.entityType = { contains: params.entityType, mode: "insensitive" };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, identifier: true, email: true, role: true } },
        },
      }),
    ]);

    return {
      items: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

