import "server-only";
import { prisma } from "@/lib/db";

/** Append-only audit trail for sensitive operations. */
export async function recordAudit(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    // Auditing must never break the primary operation.
    console.error("audit: failed to record", error);
  }
}
