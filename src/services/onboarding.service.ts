import { prisma } from "../lib/db/prisma";

export interface OnboardingStatus {
  isComplete: boolean;
  completionPercentage: number;
  steps: {
    key: string;
    label: string;
    isComplete: boolean;
    count: number;
    description: string;
  }[];
  nextPendingStep: string | null;
}

export class OnboardingService {
  /**
   * Computes system setup completion status across all institutional entities.
   */
  static async getOnboardingStatus(): Promise<OnboardingStatus> {
    const [
      institutionSettings,
      departmentCount,
      programCount,
      academicYearCount,
      batchCount,
      sectionCount,
      subjectCount,
      facultyCount,
      studentCount,
      gradingScaleCount,
    ] = await Promise.all([
      prisma.institutionSetting.findFirst(),
      prisma.department.count(),
      prisma.program.count(),
      prisma.academicYear.count(),
      prisma.batch.count(),
      prisma.section.count(),
      prisma.subject.count(),
      prisma.faculty.count(),
      prisma.student.count(),
      prisma.gradingScale.count(),
    ]);

    const steps = [
      {
        key: "institution",
        label: "Institution Profile & Branding",
        isComplete: !!institutionSettings?.institutionName && !!institutionSettings?.currentAcademicSession,
        count: institutionSettings ? 1 : 0,
        description: "Configure college name, official code, campus address, and active academic session.",
      },
      {
        key: "departments",
        label: "Academic Departments",
        isComplete: departmentCount > 0,
        count: departmentCount,
        description: "Register college departments (e.g., Computer Science, Management Studies).",
      },
      {
        key: "programs",
        label: "Degree Programs",
        isComplete: programCount > 0,
        count: programCount,
        description: "Add degree programs (e.g., B.Tech, BCA, BBA, MBA) with semester structures.",
      },
      {
        key: "academic_years",
        label: "Academic Calendar Years",
        isComplete: academicYearCount > 0,
        count: academicYearCount,
        description: "Set up academic calendar years and mark the active session.",
      },
      {
        key: "batches_sections",
        label: "Student Batches & Sections",
        isComplete: batchCount > 0 && sectionCount > 0,
        count: batchCount,
        description: "Create graduating cohorts and classroom sections.",
      },
      {
        key: "subjects_credits",
        label: "Course Subjects & Credits",
        isComplete: subjectCount > 0,
        count: subjectCount,
        description: "Define course subjects, theory/practical designations, and credit structures.",
      },
      {
        key: "grading_scale",
        label: "Grading Scale & Policies",
        isComplete: gradingScaleCount > 0,
        count: gradingScaleCount,
        description: "Establish official grade rules, grade point mappings, and passing criteria.",
      },
      {
        key: "faculty",
        label: "Faculty Instructors",
        isComplete: facultyCount > 0,
        count: facultyCount,
        description: "Provision faculty profiles for teaching assignments and marks entry.",
      },
      {
        key: "students",
        label: "Enrolled Students",
        isComplete: studentCount > 0,
        count: studentCount,
        description: "Register students with roll numbers and section enrollments.",
      },
    ];

    const completedCount = steps.filter((s) => s.isComplete).length;
    const completionPercentage = Math.round((completedCount / steps.length) * 100);
    const firstIncomplete = steps.find((s) => !s.isComplete);

    return {
      isComplete: completedCount === steps.length,
      completionPercentage,
      steps,
      nextPendingStep: firstIncomplete ? firstIncomplete.key : null,
    };
  }
}

