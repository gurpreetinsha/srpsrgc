import { describe, it, expect } from "vitest";
import { Role, ExamType, ExamStatus } from "@prisma/client";
import { AuthenticatedUser } from "../../src/lib/auth/session";
import {
  assertStudentOwnership,
  assertResultAccess,
  ForbiddenError,
} from "../../src/lib/auth/rbac";
import { InstitutionService } from "../../src/services/institution.service";
import { AcademicService } from "../../src/services/academic.service";
import { PeopleService } from "../../src/services/people.service";
import { ExaminationService } from "../../src/services/examination.service";
import { ReportService } from "../../src/services/report.service";
import { AuditExplorerService } from "../../src/services/audit-explorer.service";

describe("Phase 9: Comprehensive Authorization & Tenancy Sweep (IDOR & Escalation Defense)", () => {
  const facultyActor: AuthenticatedUser = {
    id: "faculty-uuid-002",
    identifier: "FAC101",
    email: "faculty101@srgc.edu.in",
    role: Role.FACULTY,
    isActive: true,
    facultyId: "fac-profile-001",
  };

  const studentActorA: AuthenticatedUser = {
    id: "student-uuid-003",
    identifier: "230101",
    email: "studentA@srgc.edu.in",
    role: Role.STUDENT,
    isActive: true,
    studentId: "student-profile-A",
  };

  describe("Institutional & Academic Admin Endpoints", () => {
    it("denies faculty and student from updating institution settings", async () => {
      const dummySettings = {
        institutionName: "Hacked University",
        institutionCode: "HACK",
        allowStudentRankView: true,
      };

      await expect(
        InstitutionService.updateSettings(facultyActor, dummySettings)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        InstitutionService.updateSettings(studentActorA, dummySettings)
      ).rejects.toThrow(ForbiddenError);
    });

    it("denies faculty and student from creating academic departments or programs", async () => {
      await expect(
        AcademicService.createDepartment(facultyActor, { code: "CS", name: "Comp Sci" })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        AcademicService.createDepartment(studentActorA, { code: "CS", name: "Comp Sci" })
      ).rejects.toThrow(ForbiddenError);
    });

    it("denies faculty and student from creating faculty or enrolling students", async () => {
      await expect(
        PeopleService.createFaculty(facultyActor, {
          facultyCode: "FAC999",
          firstName: "Unauthorized",
          lastName: "Faculty",
          designation: "Assistant Professor",
          departmentId: "123e4567-e89b-12d3-a456-426614174000",
          contactEmail: "test@srgc.edu.in",
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        PeopleService.createStudent(studentActorA, {
          rollNumber: "999999",
          regNumber: "REG999",
          firstName: "Unauthorized",
          lastName: "Student",
          contactEmail: "test@srgc.edu.in",
          programId: "123e4567-e89b-12d3-a456-426614174000",
          batchId: "123e4567-e89b-12d3-a456-426614174000",
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("Examination & Publication Authorization Sweep", () => {
    it("denies faculty from creating examinations or freezing rosters", async () => {
      await expect(
        ExaminationService.createExamination(facultyActor, {
          title: "Illegal Exam",
          code: "ILLEGAL01",
          academicYearId: "123e4567-e89b-12d3-a456-426614174000",
          semesterId: "123e4567-e89b-12d3-a456-426614174000",
          programId: "123e4567-e89b-12d3-a456-426614174000",
          examType: ExamType.REGULAR,
          status: ExamStatus.UPCOMING,
          startDate: new Date(),
          endDate: new Date(),
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        ExaminationService.freezeEnrollmentRoster(facultyActor, "123e4567-e89b-12d3-a456-426614174000")
      ).rejects.toThrow(ForbiddenError);
    });

    it("denies faculty and students from publishing results", async () => {
      await expect(
        ExaminationService.publishResults(facultyActor, {
          examinationId: "123e4567-e89b-12d3-a456-426614174000",
          version: 1,
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        ExaminationService.publishResults(studentActorA, {
          examinationId: "123e4567-e89b-12d3-a456-426614174000",
          version: 1,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("denies faculty and students from unpublishing results", async () => {
      await expect(
        ExaminationService.unpublishResults(facultyActor, {
          examinationId: "123e4567-e89b-12d3-a456-426614174000",
          unpublishReason: "Unauthorized attempt",
          version: 1,
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        ExaminationService.unpublishResults(studentActorA, {
          examinationId: "123e4567-e89b-12d3-a456-426614174000",
          unpublishReason: "Unauthorized attempt",
          version: 1,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("denies non-admin from performing post-publication mark corrections", async () => {
      await expect(
        ExaminationService.correctPublishedMark(facultyActor, {
          markId: "123e4567-e89b-12d3-a456-426614174000",
          internalMarks: 30,
          reason: "Faculty attempting unauthorized grade change",
          version: 1,
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        ExaminationService.correctPublishedMark(studentActorA, {
          markId: "123e4567-e89b-12d3-a456-426614174000",
          internalMarks: 30,
          reason: "Student attempting unauthorized grade change",
          version: 1,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("IDOR Protection & Cross-Student Isolation", () => {
    it("denies Student A from accessing Student B's profile", () => {
      expect(() =>
        assertStudentOwnership(studentActorA, "student-profile-B")
      ).toThrow(ForbiddenError);

      expect(() =>
        assertStudentOwnership(studentActorA, "student-profile-A")
      ).not.toThrow();
    });

    it("denies Student A from accessing Student B's result card", () => {
      expect(() =>
        assertResultAccess(studentActorA, {
          studentId: "student-profile-B",
          publicationStatus: "PUBLISHED",
        })
      ).toThrow(ForbiddenError);
    });

    it("denies Student A from accessing un-published examination marks", () => {
      expect(() =>
        assertResultAccess(studentActorA, {
          studentId: "student-profile-A",
          publicationStatus: "DRAFT",
        })
      ).toThrow("not yet been officially published");

      expect(() =>
        assertResultAccess(studentActorA, {
          studentId: "student-profile-A",
          publicationStatus: "UNPUBLISHED",
        })
      ).toThrow("not yet been officially published");
    });
  });

  describe("Auditing & Reports Access Control", () => {
    it("denies non-admin from querying system audit logs", async () => {
      await expect(
        AuditExplorerService.queryLogs(facultyActor, {})
      ).rejects.toThrow(ForbiddenError);

      await expect(
        AuditExplorerService.queryLogs(studentActorA, {})
      ).rejects.toThrow(ForbiddenError);
    });

    it("denies non-admin from exporting examination performance rosters", async () => {
      await expect(
        ReportService.exportExamRosterCsv(facultyActor, "123e4567-e89b-12d3-a456-426614174000")
      ).rejects.toThrow(ForbiddenError);

      await expect(
        ReportService.exportExamRosterCsv(studentActorA, "123e4567-e89b-12d3-a456-426614174000")
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
