import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/prisma";

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates an audit log entry within an existing database transaction.
 * Guaranteed to commit or roll back with the business mutation.
 */
export async function logAuditInTx(
  tx: Prisma.TransactionClient,
  params: CreateAuditLogParams
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldValues: params.oldValues ? (params.oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      newValues: params.newValues ? (params.newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}

/**
 * Creates a standalone audit log entry (for read events, logins, and logouts).
 */
export async function logAuditDirect(
  params: CreateAuditLogParams,
  client: PrismaClient = prisma
): Promise<void> {
  await client.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldValues: params.oldValues ? (params.oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      newValues: params.newValues ? (params.newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}
