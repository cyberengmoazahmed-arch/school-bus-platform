import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { endOfToday, startOfToday } from "@/data/shared";
import { getSchoolAttendance } from "@/data/school";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const schoolId = url.searchParams.get("schoolId");
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");

  const school = await prisma.school.findUnique({ where: { id: schoolId ?? "__missing__" }, select: { id: true, name: true } });
  if (!school) return new Response("Not found", { status: 404 });

  const isAdmin = session.role === "SUPER_ADMIN";
  const isStaff = await prisma.schoolStaff.findFirst({ where: { schoolId: school.id, userId: session.id, isActive: true } });
  if (!isAdmin && !isStaff) return new Response("Forbidden", { status: 403 });

  const to = toRaw ? new Date(`${toRaw}T23:59:59`) : endOfToday();
  const from = fromRaw ? new Date(`${fromRaw}T00:00:00`) : startOfToday();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return new Response("Invalid range", { status: 400 });
  }

  const attendance = await getSchoolAttendance(school.id, from, to);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SafeRide";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Attendance");
  sheet.columns = [
    { header: "Student", key: "name", width: 28 },
    { header: "Grade", key: "grade", width: 12 },
    { header: "Trips", key: "total", width: 8 },
    { header: "Boarded", key: "boarded", width: 10 },
    { header: "Dropped", key: "dropped", width: 10 },
    { header: "Absent", key: "absent", width: 10 },
    { header: "Missed", key: "missed", width: 10 },
    { header: "Boarded %", key: "pct", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const s of attendance) {
    const pct = s.total > 0 ? Math.round((s.boarded / s.total) * 100) : 0;
    sheet.addRow({ ...s, pct: `${pct}%` });
  }

  const buf = Buffer.from(await workbook.xlsx.writeBuffer());
  const date = `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance_${school.id.slice(0, 6)}_${date}.xlsx"`,
    },
  });
}