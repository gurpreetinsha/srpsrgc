import { prisma } from "../lib/db/prisma";
import { InstitutionSettingSchema } from "../lib/validators/academic";
import { logAuditInTx } from "../lib/audit/audit-logger";
import { assertAdmin } from "../lib/auth/rbac";
import { AuthenticatedUser } from "../lib/auth/session";
import { InstitutionSetting } from "@prisma/client";
import { z } from "zod";

export class InstitutionService {
  /**
   * Retrieves active institutional settings, creating default record if not yet created.
   */
  static async getSettings(): Promise<InstitutionSetting> {
    const existing = await prisma.institutionSetting.findFirst();
    if (existing) {
      return existing;
    }

    return await prisma.institutionSetting.create({
      data: {
        institutionName: "Shri Ram Group of Colleges",
        institutionCode: "SRGC",
        tagline: "Excellence in Technical & Professional Education",
        address: "Parikshitgarh Road, Muzaffarnagar, Uttar Pradesh",
        currentAcademicSession: "2025-2026",
        allowStudentRankView: false,
      },
    });
  }

  /**
   * Updates institutional settings (Admin only) with transactional audit trail.
   */
  static async updateSettings(
    user: AuthenticatedUser,
    input: z.infer<typeof InstitutionSettingSchema>
  ): Promise<InstitutionSetting> {
    assertAdmin(user);
    const validated = InstitutionSettingSchema.parse(input);

    return await prisma.$transaction(async (tx) => {
      const current = await tx.institutionSetting.findFirst();

      let updated: InstitutionSetting;
      if (current) {
        updated = await tx.institutionSetting.update({
          where: { id: current.id },
          data: validated,
        });
      } else {
        updated = await tx.institutionSetting.create({
          data: validated,
        });
      }

      await logAuditInTx(tx, {
        userId: user.id,
        action: "UPDATE_INSTITUTION_SETTINGS",
        entityType: "InstitutionSetting",
        entityId: updated.id,
        oldValues: current,
        newValues: updated,
      });

      return updated;
    });
  }
}
