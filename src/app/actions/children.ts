"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserOrThrow } from "@/data/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

export type ChildActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const currentAcademicYear = () => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

const addChildSchema = z.object({
  firstName: z.string().trim().min(2, "common.required"),
  lastName: z.string().trim().min(2, "common.required"),
  grade: z.string().trim().min(1, "common.required"),
  schoolId: z.string().trim().min(1, "common.required"),
  relation: z.string().trim().min(2, "common.required"),
  phone: z.string().trim().optional(),
  homeLat: z.coerce.number().optional(),
  homeLng: z.coerce.number().optional(),
  homeLabel: z.string().trim().optional(),
  homeLine: z.string().trim().optional(),
  homeCity: z.string().trim().optional(),
});

export async function addChildAction(_prev: ChildActionState, formData: FormData): Promise<ChildActionState> {
  const user = await requireUserOrThrow();
  if (user.role !== "PARENT") return { error: "PARENTS_ONLY" };

  const parsed = addChildSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }
  const data = parsed.data;

  const school = await prisma.school.findFirst({ where: { id: data.schoolId, isActive: true } });
  if (!school) return { error: "SCHOOL_NOT_FOUND" };

  // The address field may contain either a free-text line or "lat, lng".
  let homeLat = data.homeLat;
  let homeLng = data.homeLng;
  let line1 = data.homeLine?.trim();
  if (line1) {
    const parts = line1.split(",").map((p) => p.trim());
    if (parts.length === 2 && !Number.isNaN(Number(parts[0])) && !Number.isNaN(Number(parts[1]))) {
      homeLat = Number(parts[0]);
      homeLng = Number(parts[1]);
      line1 = data.homeLabel?.trim() || "Home";
    }
  }

  const existingCount = await prisma.student.count({ where: { guardians: { some: { userId: user.id } } } });

  const student = await prisma.student.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      grade: data.grade,
      school: { connect: { id: school.id } },
      ...(line1 || (homeLat != null && homeLng != null)
        ? {
            homeAddress: {
              create: {
                label: data.homeLabel ?? null,
                line1: line1 ?? "Home",
                city: data.homeCity ?? school.city,
                lat: homeLat ?? school.lat,
                lng: homeLng ?? school.lng,
              },
            },
          }
        : {}),
      guardians: {
        create: {
          userId: user.id,
          relation: data.relation,
          isPrimary: existingCount === 0,
          canPickup: true,
        },
      },
      enrollments: {
        create: {
          schoolId: school.id,
          academicYear: currentAcademicYear(),
          grade: data.grade,
          status: "ACTIVE",
        },
      },
    },
  });

  await recordAudit({ actorId: user.id, action: "STUDENT_CREATE", entity: "Student", entityId: student.id });
  revalidatePath("/parent");
  revalidatePath("/parent/children");
  return { ok: true, error: undefined };
}

export async function addPickupPersonAction(studentId: string, formData: FormData): Promise<ChildActionState> {
  const user = await requireUserOrThrow();
  const student = await prisma.student.findFirst({ where: { id: studentId, guardians: { some: { userId: user.id } } } });
  if (!student) return { error: "NOT_YOUR_CHILD" };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) return { error: "FIELDS_REQUIRED" };

  await prisma.authorizedPickupPerson.create({ data: { studentId, name, relation: "GUARDIAN", phone } });
  revalidatePath(`/parent/children/${studentId}`);
  return { ok: true, error: undefined };
}

export async function addEmergencyContactAction(studentId: string, formData: FormData): Promise<ChildActionState> {
  const user = await requireUserOrThrow();
  const student = await prisma.student.findFirst({ where: { id: studentId, guardians: { some: { userId: user.id } } } });
  if (!student) return { error: "NOT_YOUR_CHILD" };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) return { error: "FIELDS_REQUIRED" };

  await prisma.emergencyContact.create({ data: { studentId, name, relation: "GUARDIAN", phone } });
  revalidatePath(`/parent/children/${studentId}`);
  return { ok: true, error: undefined };
}

export async function toggleGuardianPrimaryAction(studentId: string): Promise<ChildActionState> {
  const user = await requireUserOrThrow();
  await prisma.$transaction([
    prisma.guardianRelationship.updateMany({
      where: { studentId },
      data: { isPrimary: false },
    }),
    prisma.guardianRelationship.update({
      where: { studentId_userId: { studentId, userId: user.id } },
      data: { isPrimary: true },
    }),
  ]);
  revalidatePath(`/parent/children/${studentId}`);
  return { ok: true, error: undefined };
}