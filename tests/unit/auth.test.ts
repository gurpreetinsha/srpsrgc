import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/auth/argon";
import {
  generateSessionToken,
  hashSessionToken,
  AuthenticatedUser,
} from "../../src/lib/auth/session";
import {
  assertAdmin,
  assertFaculty,
  assertStudent,
  assertStudentOwnership,
  assertResultAccess,
  ForbiddenError,
} from "../../src/lib/auth/rbac";
import { validatePasswordStrength } from "../../src/scripts/bootstrap-admin";
import { Role } from "@prisma/client";

describe("Phase 3: Auth, Sessions & RBAC Unit Tests", () => {
  describe("Password Hashing & Verification (Argon2id / Bcrypt Fallback)", () => {
    it("hashes password and verifies successfully", async () => {
      const password = "SecureP@ssw0rd2026!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(20);
      expect(hash).not.toBe(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password verification", async () => {
      const password = "CorrectPassword123#";
      const hash = await hashPassword(password);

      const isInvalid = await verifyPassword("WrongPassword!", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Session Cryptography", () => {
    it("generates 256-bit (64 hex char) random session tokens", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it("deterministically computes SHA-256 digest of session token", () => {
      const token = "a".repeat(64);
      const hash1 = hashSessionToken(token);
      const hash2 = hashSessionToken(token);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(token);
    });
  });

  describe("Centralized RBAC Module", () => {
    const adminUser: AuthenticatedUser = {
      id: "u-admin",
      identifier: "admin@srgc.edu.in",
      email: "admin@srgc.edu.in",
      role: Role.ADMIN,
      isActive: true,
    };

    const facultyUser: AuthenticatedUser = {
      id: "u-faculty",
      identifier: "FAC001",
      email: "prof@srgc.edu.in",
      role: Role.FACULTY,
      isActive: true,
      facultyId: "f-123",
    };

    const studentUser: AuthenticatedUser = {
      id: "u-student",
      identifier: "230101",
      email: "student@srgc.edu.in",
      role: Role.STUDENT,
      isActive: true,
      studentId: "s-456",
    };

    it("assertAdmin allows ADMIN and throws ForbiddenError for others", () => {
      expect(() => assertAdmin(adminUser)).not.toThrow();
      expect(() => assertAdmin(facultyUser)).toThrow(ForbiddenError);
      expect(() => assertAdmin(studentUser)).toThrow(ForbiddenError);
    });

    it("assertFaculty allows FACULTY with facultyId and throws for others", () => {
      expect(() => assertFaculty(facultyUser)).not.toThrow();
      expect(() => assertFaculty(adminUser)).toThrow(ForbiddenError);
      expect(() => assertFaculty(studentUser)).toThrow(ForbiddenError);

      const facultyWithoutProfile: AuthenticatedUser = {
        ...facultyUser,
        facultyId: undefined,
      };
      expect(() => assertFaculty(facultyWithoutProfile)).toThrow(ForbiddenError);
    });

    it("assertStudent allows STUDENT with studentId and throws for others", () => {
      expect(() => assertStudent(studentUser)).not.toThrow();
      expect(() => assertStudent(adminUser)).toThrow(ForbiddenError);
      expect(() => assertStudent(facultyUser)).toThrow(ForbiddenError);
    });

    it("assertStudentOwnership enforces student isolation", () => {
      // Student accessing own ID succeeds
      expect(() => assertStudentOwnership(studentUser, "s-456")).not.toThrow();

      // Student accessing other student ID throws ForbiddenError
      expect(() => assertStudentOwnership(studentUser, "s-999")).toThrow(ForbiddenError);

      // Admin accessing any student ID succeeds
      expect(() => assertStudentOwnership(adminUser, "s-999")).not.toThrow();
    });

    it("assertResultAccess enforces publication status rules for students", () => {
      // Student can view own PUBLISHED result
      expect(() =>
        assertResultAccess(studentUser, {
          studentId: "s-456",
          publicationStatus: "PUBLISHED",
        })
      ).not.toThrow();

      // Student CANNOT view own DRAFT or UNPUBLISHED result
      expect(() =>
        assertResultAccess(studentUser, {
          studentId: "s-456",
          publicationStatus: "DRAFT",
        })
      ).toThrow(ForbiddenError);

      // Student CANNOT view another student's published result
      expect(() =>
        assertResultAccess(studentUser, {
          studentId: "s-999",
          publicationStatus: "PUBLISHED",
        })
      ).toThrow(ForbiddenError);

      // Admin can view any status
      expect(() =>
        assertResultAccess(adminUser, {
          studentId: "s-999",
          publicationStatus: "DRAFT",
        })
      ).not.toThrow();
    });
  });

  describe("Admin Bootstrap Password Strength Policy", () => {
    it("accepts a compliant password meeting all criteria", () => {
      const res = validatePasswordStrength("SrgcAdmin#2026!");
      expect(res.isValid).toBe(true);
    });

    it("rejects password shorter than 10 characters", () => {
      const res = validatePasswordStrength("Srgc#1!");
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain("at least 10 characters");
    });

    it("rejects password without uppercase letter", () => {
      const res = validatePasswordStrength("srgcadmin#2026!");
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain("uppercase");
    });

    it("rejects password without special character", () => {
      const res = validatePasswordStrength("SrgcAdmin2026");
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain("special character");
    });
  });
});

