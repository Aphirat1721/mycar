import { prisma } from "@/lib/prisma";
import type { AuditResult } from "@/generated/prisma/client";

export async function audit(params: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: AuditResult;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        result: params.result,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("audit_log_failed", error instanceof Error ? error.message : "unknown");
  }
}
